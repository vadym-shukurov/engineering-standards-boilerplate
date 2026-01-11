package com.company.banking.transfer.service;

import com.company.banking.account.domain.Account;
import com.company.banking.account.repository.AccountRepository;
import com.company.banking.common.exception.AccountNotFoundException;
import com.company.banking.common.exception.InsufficientFundsException;
import com.company.banking.common.exception.InvalidAmountException;
import com.company.banking.common.exception.TransferValidationException;
import com.company.banking.notification.service.NotificationService;
import com.company.banking.transfer.domain.TransferRequest;
import com.company.banking.transfer.domain.TransferResult;
import com.company.banking.transfer.event.TransferCompletedEvent;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

/**
 * Unit Tests for {@link TransferService}.
 *
 * <h2>Test Strategy</h2>
 * <ul>
 *   <li><b>Coverage Target:</b> 85%+ line coverage, 100% branch coverage for critical paths</li>
 *   <li><b>Test Pyramid:</b> Fast, isolated unit tests with mocked dependencies</li>
 *   <li><b>BDD Style:</b> Given-When-Then structure for readability</li>
 *   <li><b>Edge Cases:</b> Boundary conditions, null inputs, concurrent scenarios</li>
 * </ul>
 *
 * @author Vadym Shukurov
 * @see TransferService
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TransferService Unit Tests")
class TransferServiceTest {

    // =========================================================================
    // MOCKS & TEST FIXTURES
    // =========================================================================

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private TransferValidator transferValidator;

    @Captor
    private ArgumentCaptor<TransferCompletedEvent> eventCaptor;

    @Captor
    private ArgumentCaptor<Account> accountCaptor;

    private MeterRegistry meterRegistry;
    private TransferService transferService;

    // Test Data Constants
    private static final String SOURCE_ACCOUNT_ID = "ACC-SOURCE-001";
    private static final String TARGET_ACCOUNT_ID = "ACC-TARGET-002";
    private static final String SOURCE_EMAIL = "source@example.com";
    private static final String TARGET_EMAIL = "target@example.com";
    private static final BigDecimal INITIAL_SOURCE_BALANCE = new BigDecimal("1000.00");
    private static final BigDecimal INITIAL_TARGET_BALANCE = new BigDecimal("500.00");
    private static final BigDecimal TRANSFER_AMOUNT = new BigDecimal("250.00");

    // =========================================================================
    // TEST SETUP
    // =========================================================================

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        transferService = new TransferService(
            accountRepository,
            notificationService,
            eventPublisher,
            transferValidator,
            meterRegistry
        );
    }

    // =========================================================================
    // HAPPY PATH TESTS
    // =========================================================================

    @Nested
    @DisplayName("Given valid transfer request")
    class ValidTransferTests {

        @Test
        @DisplayName("Should complete transfer successfully")
        void shouldCompleteTransferSuccessfully() {
            // Given
            var sourceAccount = createAccount(SOURCE_ACCOUNT_ID, INITIAL_SOURCE_BALANCE, SOURCE_EMAIL);
            var targetAccount = createAccount(TARGET_ACCOUNT_ID, INITIAL_TARGET_BALANCE, TARGET_EMAIL);
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, TARGET_ACCOUNT_ID, TRANSFER_AMOUNT);

            given(accountRepository.findByIdWithLock(SOURCE_ACCOUNT_ID))
                .willReturn(Optional.of(sourceAccount));
            given(accountRepository.findByIdWithLock(TARGET_ACCOUNT_ID))
                .willReturn(Optional.of(targetAccount));

            // When
            TransferResult result = transferService.transferFunds(request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.status()).isEqualTo(TransferResult.Status.COMPLETED);
            assertThat(result.transactionId()).isNotBlank();
            assertThat(result.amount()).isEqualByComparingTo(TRANSFER_AMOUNT);
            assertThat(result.sourceBalanceAfter())
                .isEqualByComparingTo(INITIAL_SOURCE_BALANCE.subtract(TRANSFER_AMOUNT));
            assertThat(result.targetBalanceAfter())
                .isEqualByComparingTo(INITIAL_TARGET_BALANCE.add(TRANSFER_AMOUNT));

            // Verify persistence
            then(accountRepository).should(times(2)).save(accountCaptor.capture());

            // Verify event published
            then(eventPublisher).should().publishEvent(eventCaptor.capture());
            assertThat(eventCaptor.getValue().getResult().transactionId())
                .isEqualTo(result.transactionId());

            // Verify notification sent
            then(notificationService).should()
                .sendTransferReceiptAsync(eq(SOURCE_EMAIL), eq(TRANSFER_AMOUNT));

            // Verify metrics incremented
            assertThat(meterRegistry.counter("transfers.success").count()).isEqualTo(1.0);
        }

        @ParameterizedTest(name = "Transfer amount {0} should succeed")
        @CsvSource({
            "0.01",      // Minimum valid amount
            "100.00",    // Normal amount
            "999999.99", // Near maximum
            "1000000.00" // Maximum valid amount
        })
        @DisplayName("Should accept valid transfer amounts")
        void shouldAcceptValidTransferAmounts(String amountStr) {
            // Given
            BigDecimal amount = new BigDecimal(amountStr);
            var sourceAccount = createAccount(SOURCE_ACCOUNT_ID, new BigDecimal("2000000.00"), SOURCE_EMAIL);
            var targetAccount = createAccount(TARGET_ACCOUNT_ID, INITIAL_TARGET_BALANCE, TARGET_EMAIL);
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, TARGET_ACCOUNT_ID, amount);

            given(accountRepository.findByIdWithLock(SOURCE_ACCOUNT_ID))
                .willReturn(Optional.of(sourceAccount));
            given(accountRepository.findByIdWithLock(TARGET_ACCOUNT_ID))
                .willReturn(Optional.of(targetAccount));

            // When
            TransferResult result = transferService.transferFunds(request);

            // Then
            assertThat(result.status()).isEqualTo(TransferResult.Status.COMPLETED);
        }
    }

    // =========================================================================
    // VALIDATION ERROR TESTS
    // =========================================================================

    @Nested
    @DisplayName("Given invalid transfer amount")
    class InvalidAmountTests {

        @ParameterizedTest(name = "Amount {0} should be rejected")
        @ValueSource(strings = { "0", "-1", "-100.50", "0.001", "0.009" })
        @DisplayName("Should reject amounts below minimum")
        void shouldRejectAmountsBelowMinimum(String amountStr) {
            // Given
            BigDecimal amount = new BigDecimal(amountStr);
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, TARGET_ACCOUNT_ID, amount);

            // When/Then
            assertThatThrownBy(() -> transferService.transferFunds(request))
                .isInstanceOf(InvalidAmountException.class)
                .hasMessageContaining("at least");

            // Verify no side effects
            then(accountRepository).should(never()).save(any());
            then(eventPublisher).should(never()).publishEvent(any());
        }

        @Test
        @DisplayName("Should reject amount exceeding maximum")
        void shouldRejectAmountExceedingMaximum() {
            // Given
            BigDecimal excessiveAmount = new BigDecimal("1000000.01");
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, TARGET_ACCOUNT_ID, excessiveAmount);

            // When/Then
            assertThatThrownBy(() -> transferService.transferFunds(request))
                .isInstanceOf(InvalidAmountException.class)
                .hasMessageContaining("must not exceed");
        }

        @ParameterizedTest
        @NullSource
        @DisplayName("Should reject null amount")
        void shouldRejectNullAmount(BigDecimal nullAmount) {
            // Given
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, TARGET_ACCOUNT_ID, nullAmount);

            // When/Then
            assertThatThrownBy(() -> transferService.transferFunds(request))
                .isInstanceOf(InvalidAmountException.class)
                .hasMessageContaining("must not be null");
        }
    }

    // =========================================================================
    // ACCOUNT VALIDATION TESTS
    // =========================================================================

    @Nested
    @DisplayName("Given account validation scenarios")
    class AccountValidationTests {

        @Test
        @DisplayName("Should reject transfer to same account")
        void shouldRejectTransferToSameAccount() {
            // Given
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, SOURCE_ACCOUNT_ID, TRANSFER_AMOUNT);

            // When/Then
            assertThatThrownBy(() -> transferService.transferFunds(request))
                .isInstanceOf(TransferValidationException.class)
                .hasMessageContaining("must be different");
        }

        @Test
        @DisplayName("Should throw when source account not found")
        void shouldThrowWhenSourceAccountNotFound() {
            // Given
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, TARGET_ACCOUNT_ID, TRANSFER_AMOUNT);
            given(accountRepository.findByIdWithLock(SOURCE_ACCOUNT_ID))
                .willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> transferService.transferFunds(request))
                .isInstanceOf(AccountNotFoundException.class);

            // Verify failure metric
            assertThat(meterRegistry.counter("transfers.failure").count()).isEqualTo(1.0);
        }

        @Test
        @DisplayName("Should throw when target account not found")
        void shouldThrowWhenTargetAccountNotFound() {
            // Given
            var sourceAccount = createAccount(SOURCE_ACCOUNT_ID, INITIAL_SOURCE_BALANCE, SOURCE_EMAIL);
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, TARGET_ACCOUNT_ID, TRANSFER_AMOUNT);

            given(accountRepository.findByIdWithLock(SOURCE_ACCOUNT_ID))
                .willReturn(Optional.of(sourceAccount));
            given(accountRepository.findByIdWithLock(TARGET_ACCOUNT_ID))
                .willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> transferService.transferFunds(request))
                .isInstanceOf(AccountNotFoundException.class);
        }
    }

    // =========================================================================
    // INSUFFICIENT FUNDS TESTS
    // =========================================================================

    @Nested
    @DisplayName("Given insufficient funds scenario")
    class InsufficientFundsTests {

        @Test
        @DisplayName("Should throw when source has insufficient balance")
        void shouldThrowWhenInsufficientBalance() {
            // Given
            BigDecimal lowBalance = new BigDecimal("100.00");
            BigDecimal transferAmount = new BigDecimal("500.00");

            var sourceAccount = createAccount(SOURCE_ACCOUNT_ID, lowBalance, SOURCE_EMAIL);
            var targetAccount = createAccount(TARGET_ACCOUNT_ID, INITIAL_TARGET_BALANCE, TARGET_EMAIL);
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, TARGET_ACCOUNT_ID, transferAmount);

            given(accountRepository.findByIdWithLock(SOURCE_ACCOUNT_ID))
                .willReturn(Optional.of(sourceAccount));
            given(accountRepository.findByIdWithLock(TARGET_ACCOUNT_ID))
                .willReturn(Optional.of(targetAccount));

            // When/Then
            assertThatThrownBy(() -> transferService.transferFunds(request))
                .isInstanceOf(InsufficientFundsException.class)
                .hasMessageContaining("Insufficient funds");

            // Verify no changes persisted
            then(accountRepository).should(never()).save(any());
        }

        @Test
        @DisplayName("Should succeed when balance exactly equals transfer amount")
        void shouldSucceedWhenBalanceExactlyEqualsAmount() {
            // Given
            BigDecimal exactBalance = new BigDecimal("250.00");

            var sourceAccount = createAccount(SOURCE_ACCOUNT_ID, exactBalance, SOURCE_EMAIL);
            var targetAccount = createAccount(TARGET_ACCOUNT_ID, INITIAL_TARGET_BALANCE, TARGET_EMAIL);
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, TARGET_ACCOUNT_ID, exactBalance);

            given(accountRepository.findByIdWithLock(SOURCE_ACCOUNT_ID))
                .willReturn(Optional.of(sourceAccount));
            given(accountRepository.findByIdWithLock(TARGET_ACCOUNT_ID))
                .willReturn(Optional.of(targetAccount));

            // When
            TransferResult result = transferService.transferFunds(request);

            // Then
            assertThat(result.sourceBalanceAfter()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // =========================================================================
    // NOTIFICATION FAILURE TESTS (Non-Critical Path)
    // =========================================================================

    @Nested
    @DisplayName("Given notification service failures")
    class NotificationFailureTests {

        @Test
        @DisplayName("Should complete transfer even when notification fails")
        void shouldCompleteTransferEvenWhenNotificationFails() {
            // Given
            var sourceAccount = createAccount(SOURCE_ACCOUNT_ID, INITIAL_SOURCE_BALANCE, SOURCE_EMAIL);
            var targetAccount = createAccount(TARGET_ACCOUNT_ID, INITIAL_TARGET_BALANCE, TARGET_EMAIL);
            var request = createTransferRequest(SOURCE_ACCOUNT_ID, TARGET_ACCOUNT_ID, TRANSFER_AMOUNT);

            given(accountRepository.findByIdWithLock(SOURCE_ACCOUNT_ID))
                .willReturn(Optional.of(sourceAccount));
            given(accountRepository.findByIdWithLock(TARGET_ACCOUNT_ID))
                .willReturn(Optional.of(targetAccount));

            // Simulate notification failure
            doThrow(new RuntimeException("Email service unavailable"))
                .when(notificationService).sendTransferReceiptAsync(any(), any());

            // When
            TransferResult result = transferService.transferFunds(request);

            // Then - Transfer should still complete
            assertThat(result.status()).isEqualTo(TransferResult.Status.COMPLETED);
            then(accountRepository).should(times(2)).save(any());
        }
    }

    // =========================================================================
    // TEST UTILITIES
    // =========================================================================

    private Account createAccount(String id, BigDecimal balance, String email) {
        return Account.builder()
            .id(id)
            .balance(balance)
            .email(email)
            .build();
    }

    private TransferRequest createTransferRequest(String sourceId, String targetId, BigDecimal amount) {
        return TransferRequest.builder()
            .sourceAccountId(sourceId)
            .targetAccountId(targetId)
            .amount(amount)
            .build();
    }
}
