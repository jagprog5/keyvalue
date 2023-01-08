// if password and repeat don't match, colorize for feedback
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const createAccountButton = document.getElementById('create-account-button');

const repeatPasswordInput = document.getElementById('repeat-password-input');
function checkMatching() {
    passwordInput.classList.remove('error');
    repeatPasswordInput.classList.remove('error');
    if (passwordInput.value == repeatPasswordInput.value
        || passwordInput.value.length == 0
        || repeatPasswordInput.value.length == 0) {
        repeatPasswordInput.classList.remove('warn');
    } else {
        repeatPasswordInput.classList.add('warn');
    }
}
passwordInput.addEventListener('input', checkMatching);
repeatPasswordInput.addEventListener('input', checkMatching);

usernameInput.addEventListener('input', function () {
    usernameInput.classList.remove('error');
});

createAccountButton.addEventListener('click', function () {
    let fieldsGood = true;
    if (usernameInput.value.length == 0) {
        usernameInput.classList.add('error');
        fieldsGood = false;
    }
    if (passwordInput.value != repeatPasswordInput.value
        || passwordInput.value.length == 0) {
        passwordInput.classList.add('error');
        repeatPasswordInput.classList.add('error');
        fieldsGood = false;
    }
    if (fieldsGood) {
        // post it to the server and see if the account creation is successfull
        let serverGood = true;
        // account creation successful
        // set session storage as if the user logged in, and redirect
        location.href = "/pages/set-get-page.html";
    }
});
