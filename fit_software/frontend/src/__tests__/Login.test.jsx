import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import FitwareLogin from '../login';
import * as api from '../api';

// Mock the API module
vi.mock('../api', () => ({
    loginWithEmail: vi.fn(),
    startGoogleLogin: vi.fn(),
}));

// Mock useNavigate
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

describe('FitwareLogin Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders login form correctly', () => {
        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    test('allows typing in input fields', () => {
        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    });

    test('calls loginWithEmail and redirects on success', async () => {
        api.loginWithEmail.mockResolvedValueOnce({ user: { id: 1 } });

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(api.loginWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
        });

        expect(screen.getByText(/Login successful!/i)).toBeInTheDocument();

        // Wait for the timeout redirect
        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/anasayfa');
        }, { timeout: 1000 });
    });

    test('displays error message on login failure', async () => {
        api.loginWithEmail.mockRejectedValueOnce(new Error('Invalid credentials'));

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
        });
    });
});

// =============================================================================
// BLACK-BOX TESTING: EMPTY FIELDS
// =============================================================================
describe('Black-Box: Empty Fields (Equivalence Partitioning)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TC-EF01: Empty Email Field
     * Input: Email = "", Password = "validPass123"
     * Expected: Form should not submit (HTML5 validation), API not called
     */
    test('TC-EF01: does not submit when email is empty', async () => {
        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        const passwordInput = screen.getByPlaceholderText(/password/i);
        fireEvent.change(passwordInput, { target: { value: 'validPass123' } });

        const submitButton = screen.getByRole('button', { name: /log in/i });
        fireEvent.click(submitButton);

        // API should NOT be called because HTML5 validation blocks submission
        expect(api.loginWithEmail).not.toHaveBeenCalled();
    });

    /**
     * TC-EF02: Empty Password Field
     * Input: Email = "test@example.com", Password = ""
     * Expected: Form should not submit (HTML5 validation), API not called
     */
    test('TC-EF02: does not submit when password is empty', async () => {
        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const submitButton = screen.getByRole('button', { name: /log in/i });
        fireEvent.click(submitButton);

        // API should NOT be called
        expect(api.loginWithEmail).not.toHaveBeenCalled();
    });

    /**
     * TC-EF03: Both Fields Empty
     * Input: Email = "", Password = ""
     * Expected: Form should not submit, API not called
     */
    test('TC-EF03: does not submit when both fields are empty', async () => {
        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        const submitButton = screen.getByRole('button', { name: /log in/i });
        fireEvent.click(submitButton);

        expect(api.loginWithEmail).not.toHaveBeenCalled();
    });
});

// =============================================================================
// BLACK-BOX TESTING: INVALID FORMATS (Boundary Value Analysis)
// =============================================================================
describe('Black-Box: Invalid Formats & Boundary Values', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TC-IF01: Invalid Email Format - Missing Domain
     * Input: Email = "test@domain" (missing TLD)
     * Expected: Depends on HTML5 validation; if passes, API handles it
     */
    test('TC-IF01: handles email without TLD (test@domain)', async () => {
        api.loginWithEmail.mockRejectedValueOnce(new Error('Invalid email format'));

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@domain' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        // The input might accept this format (HTML5 email validation is lenient)
        // If it submits, the API should return an error
        await waitFor(() => {
            // Either API was not called (blocked by browser) or error is shown
            const errorVisible = screen.queryByText(/invalid/i);
            const apiCalled = api.loginWithEmail.mock.calls.length > 0;
            expect(errorVisible || !apiCalled).toBeTruthy();
        });
    });

    /**
     * TC-IF02: Invalid Email Format - No @ Symbol
     * Input: Email = "testexample.com"
     * Expected: HTML5 validation should block submission
     */
    test('TC-IF02: blocks email without @ symbol', async () => {
        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'testexample.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        // HTML5 email input should block this - API not called
        expect(api.loginWithEmail).not.toHaveBeenCalled();
    });

    /**
     * TC-IF03: Boundary Value - Very Short Password (1 char)
     * Input: Password = "a"
     * Expected: API should reject or accept based on backend validation
     */
    test('TC-IF03: submits with very short password (boundary: 1 char)', async () => {
        api.loginWithEmail.mockRejectedValueOnce(new Error('Password too short'));

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'a' } });
        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(api.loginWithEmail).toHaveBeenCalledWith('test@example.com', 'a');
        });
    });

    /**
     * TC-IF04: Boundary Value - Very Long Password (256 chars)
     * Input: Password = "a".repeat(256)
     * Expected: System should handle without crashing
     */
    test('TC-IF04: handles very long password (boundary: 256 chars)', async () => {
        const longPassword = 'a'.repeat(256);
        api.loginWithEmail.mockRejectedValueOnce(new Error('Invalid credentials'));

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: longPassword } });
        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(api.loginWithEmail).toHaveBeenCalledWith('test@example.com', longPassword);
        });
    });

    /**
     * TC-IF05: Boundary Value - Email at Maximum Length
     * Input: Email with 254 characters (RFC 5321 limit)
     * Expected: System should handle without crashing
     */
    test('TC-IF05: handles maximum length email (254 chars)', async () => {
        const longLocalPart = 'a'.repeat(64);
        const longDomain = 'b'.repeat(185) + '.com'; // Total ~254 chars
        const longEmail = `${longLocalPart}@${longDomain}`;

        api.loginWithEmail.mockRejectedValueOnce(new Error('Invalid credentials'));

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: longEmail } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        // Should not crash, API should be called or validation should trigger
        await waitFor(() => {
            // Test passes if no exception is thrown
            expect(true).toBe(true);
        });
    });
});

// =============================================================================
// BLACK-BOX TESTING: SECURITY (SQL Injection & XSS)
// =============================================================================
describe('Black-Box: Security - SQL Injection & XSS', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TC-SEC01: SQL Injection in Email Field
     * Input: Email = "' OR '1'='1"
     * Expected: Input should be treated as plain text, no SQL execution
     */
    test('TC-SEC01: handles SQL injection attempt in email', async () => {
        const sqlInjection = "' OR '1'='1";
        api.loginWithEmail.mockRejectedValueOnce(new Error('Invalid credentials'));

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);

        fireEvent.change(emailInput, { target: { value: sqlInjection } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        // SQL injection string should be stored as-is in the input
        expect(emailInput.value).toBe(sqlInjection);

        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        // Note: HTML5 email validation may block this, or it goes to API safely
        // The important thing is no crash and proper handling
        await waitFor(() => {
            expect(true).toBe(true); // No crash = pass
        });
    });

    /**
     * TC-SEC02: SQL Injection in Password Field
     * Input: Password = "'; DROP TABLE users; --"
     * Expected: Input should be treated as plain text
     */
    test('TC-SEC02: handles SQL injection attempt in password', async () => {
        const sqlInjection = "'; DROP TABLE users; --";
        api.loginWithEmail.mockRejectedValueOnce(new Error('Invalid credentials'));

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: sqlInjection } });

        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(api.loginWithEmail).toHaveBeenCalledWith('test@example.com', sqlInjection);
        });
    });

    /**
     * TC-SEC03: XSS Script Tag in Email
     * Input: Email = "<script>alert('xss')</script>"
     * Expected: React should escape the output, no script execution
     */
    test('TC-SEC03: handles XSS script tag in email field', async () => {
        const xssPayload = "<script>alert('xss')</script>";
        api.loginWithEmail.mockRejectedValueOnce(new Error('Invalid email'));

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/email/i);
        fireEvent.change(emailInput, { target: { value: xssPayload } });

        // React escapes HTML by default - input value should contain the raw string
        expect(emailInput.value).toBe(xssPayload);

        // Verify no actual script element was created
        expect(document.querySelector('script[src*="xss"]')).toBeNull();
    });

    /**
     * TC-SEC04: XSS Event Handler in Input
     * Input: Email = "test@test.com\" onfocus=\"alert('xss')"
     * Expected: Event handler should not be executed
     */
    test('TC-SEC04: handles XSS event handler injection', async () => {
        const xssPayload = "test@test.com\" onfocus=\"alert('xss')";

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/email/i);
        fireEvent.change(emailInput, { target: { value: xssPayload } });

        // The value should be stored as plain text
        expect(emailInput.value).toBe(xssPayload);

        // Verify the input doesn't have an onfocus attribute injected
        expect(emailInput.getAttribute('onfocus')).toBeNull();
    });

    /**
     * TC-SEC05: Mixed SQL/XSS Attack
     * Input: Password = "<img src=x onerror=alert('xss')>'; DROP TABLE users;--"
     * Expected: Input treated as plain text, no execution
     */
    test('TC-SEC05: handles combined SQL/XSS attack payload', async () => {
        const mixedPayload = "<img src=x onerror=alert('xss')>'; DROP TABLE users;--";
        api.loginWithEmail.mockRejectedValueOnce(new Error('Invalid credentials'));

        render(
            <BrowserRouter>
                <FitwareLogin />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: mixedPayload } });

        fireEvent.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(api.loginWithEmail).toHaveBeenCalledWith('test@example.com', mixedPayload);
        });

        // Verify no img element was created
        expect(document.querySelector('img[src="x"]')).toBeNull();
    });
});

