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



const btn = document.getElementById('button');
const form = document.getElementById('form');

// ✅ Initialize EmailJS with public key
emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);

form.addEventListener('submit', function(event) {
  event.preventDefault();

  btn.innerText = 'Sending...';

  const serviceID = EMAIL_CONFIG.SERVICE_ID;
  const templateID = EMAIL_CONFIG.TEMPLATE_ID;

  emailjs.sendForm(serviceID, templateID, this)
    .then(() => {
      btn.innerText = 'Submitted';
      form.reset();
      setTimeout(() => {
        btn.innerText = 'Send Message 🚀'
      }, 3000);
    }, (err) => {
      console.error('EmailJS error :',err);
      btn.innerText = 'Falied';
      setTimeout(() => {
        btn.innerText = 'Send Message 🚀';
      },3000);
    });
});
