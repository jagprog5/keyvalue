// script loaded at end of body

// prefetch theme toggle images. otherwise there is a noticable delay before display
var lightPreload = new Image();
var lightHoverPreload = new Image();
var darkPreload = new Image();
var darkHoverPreload = new Image();
lightPreload.src = "assets/light-theme.png";
lightHoverPreload.src = "assets/light-theme-hover.png";
darkPreload.src = "assets/dark-theme.png";
darkHoverPreload.src = "assets/dark-theme-hover.png";

const themeToggleBtn = document.getElementById("theme-toggle");
themeToggleBtn.addEventListener("click", function () {
  theme = theme == TOGGLED ? DEFAULT : TOGGLED;
  localStorage.setItem(THEME, theme);

  let elems = document.querySelectorAll("*");
  for (i = 0; i < elems.length; ++i) {
    elems[i].classList.toggle(TOGGLED);
  }
});
