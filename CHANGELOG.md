# Changelog

## [2.0.0] - 2025-12-10

**BumbleSMM Version 2.0 is here!**
This major update brings a fully functional local development environment, enhanced security features, and a smoother user experience.

### 🚀 New Features
-   **Authentication Popup**: Login and Register now happen instantly on the homepage without page reloads.
-   **Math Captcha**: Added security verification to the registration process to prevent bots.
-   **Mock Database**: Complete transition to a robust local mock database for reliable testing and development without external dependencies.
-   **Admin User Management**: 
    -   Admins can now **Create Users** directly from the panel.
    -   **Promote/Demote** functionality is fully fixed and verified.
    -   **Suspend/Activate** accounts working seamlessly.

### 🐛 Bug Fixes
-   Fixed "Buy Now" button 404 error on homepage.
-   Fixed broken Admin Promotion logic.
-   Removed confusing Admin icons from the standard User Dashboard.
-   Resolved issues with user status updates failing silently.

### 🛠 Technical Updates
-   Refactored `Auth` logic into reusable components.
-   Improved error logging for database operations.
-   Relaxed database equality checks for better stability.
