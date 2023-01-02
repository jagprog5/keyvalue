// script loaded at end of body

const themeToggleBtn = document.querySelector(".theme-toggle");

themeToggleBtn.addEventListener("click", function () {
  theme = theme == TOGGLED ? DEFAULT : TOGGLED;
  localStorage.setItem(THEME, theme);

  let elems = document.querySelectorAll("*");
  for (i = 0; i < elems.length; ++i) {
    elems[i].classList.toggle(TOGGLED);
  }
});