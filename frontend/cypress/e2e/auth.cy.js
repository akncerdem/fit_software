describe('Authentication Flow', () => {
    beforeEach(() => {
        // Visit the home page (login page)
        cy.visit('http://localhost:5173/');
    });

    it('displays the login form', () => {
        cy.contains('Log In').should('be.visible');
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
    });

    it('allows navigation to signup', () => {
        cy.contains('Sign Up').click();
        cy.url().should('include', '/signup');
        cy.contains('Create account').should('be.visible');
    });

    it('shows error on invalid login', () => {
        cy.intercept('POST', '**/api/v1/auth/login/', {
            statusCode: 401,
            body: { error: 'Invalid credentials' },
        }).as('loginRequest');

        cy.get('input[type="email"]').type('wrong@test.com');
        cy.get('input[type="password"]').type('wrongpass');
        cy.contains('button', 'Log In').click();

        cy.wait('@loginRequest');
        cy.contains('Invalid credentials').should('be.visible');
    });

    it('redirects to dashboard on successful login', () => {
        cy.intercept('POST', '**/api/v1/auth/login/', {
            statusCode: 200,
            body: {
                tokens: { access: 'fake-token', refresh: 'fake-refresh' },
                user: { email: 'test@test.com' },
            },
        }).as('loginRequest');

        cy.get('input[type="email"]').type('test@test.com');
        cy.get('input[type="password"]').type('password123');
        cy.contains('button', 'Log In').click();

        cy.wait('@loginRequest');
        cy.contains('Login successful').should('be.visible');
        // Using a long timeout because the redirect has a delay in the code
        cy.location('pathname', { timeout: 10000 }).should('eq', '/anasayfa');
    });
});
