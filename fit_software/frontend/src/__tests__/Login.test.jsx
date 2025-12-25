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
