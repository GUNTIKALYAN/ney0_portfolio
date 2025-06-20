const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});



const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav__link");

  window.addEventListener("scroll", () => {
    let scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionTop = current.offsetTop - 100;
      const sectionHeight = current.offsetHeight;
      const sectionId = current.getAttribute("id");

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove("active-link");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active-link");
          }
        });
      }
    });
  });