const AUTH_KEY = "ims_expense_auth_state";
const PASSWORD_KEY = "ims_expense_admin_password";
const DEFAULT_ADMIN_PASSWORD = "admin"; // Easy default for demo, user can change

export const authService = {
  isAdmin() {
    return localStorage.getItem(AUTH_KEY) === "admin";
  },

  getAdminPassword() {
    return localStorage.getItem(PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  },

  loginAdmin(inputPassword) {
    const storedPass = this.getAdminPassword();
    if (inputPassword === storedPass) {
      localStorage.setItem(AUTH_KEY, "admin");
      return { success: true, message: "Welcome back, Admin!" };
    }
    return { success: false, message: "Incorrect Admin Password." };
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
  },

  setAdminPassword(currentPassword, newPassword) {
    const storedPass = this.getAdminPassword();
    if (currentPassword !== storedPass) {
      return { success: false, message: "Current password does not match." };
    }
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: "New password must be at least 4 characters." };
    }
    localStorage.setItem(PASSWORD_KEY, newPassword.trim());
    return { success: true, message: "Admin password updated successfully!" };
  }
};
