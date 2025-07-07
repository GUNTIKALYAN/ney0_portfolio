const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');




const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav__link");

  window.addEventListener("scroll", () => {
    let scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionTop = current.offsetTop - 150;
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

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');

  if (navMenu.classList.contains('open')) {
    navToggle.style.color = '#00ff88'; 
  } else {
    navToggle.style.color = ''; 
  }
});


navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    navToggle.style.color = ''; // reset color
    navToggle.classList.remove('active');
  });
});



const btn = document.getElementById('button');
const form = document.getElementById('form');

// Initialize EmailJS with public key
emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);

form.addEventListener('submit', function(event) {
  event.preventDefault();
  btn.innerText = 'Sending...';

  const serviceID = EMAIL_CONFIG.SERVICE_ID;
  const templateID = EMAIL_CONFIG.TEMPLATE_ID;
  const templateownerID = EMAIL_CONFIG.OWNER_TEMPLATE_ID;

  // Send auto-reply to user
  emailjs.sendForm(serviceID, templateID, this)
    .then(() => {
      //  Then send a copy to owner
      emailjs.sendForm(serviceID, templateownerID, this)
        .then(() => {
          console.log("Form sent to Owner");
          btn.innerText = 'Submitted';
          form.reset(); 

          setTimeout(() => {
            btn.innerText = 'Send Message 🚀';
          }, 2000);
        })
        .catch((err) => {
          alert('Failed to send confirmation email to user. Please try again.');
          btn.innerText = 'Failed';
          setTimeout(() => {
            btn.innerText = 'Send Message 🚀';
          }, 2000);
        });
    })
    .catch((err) => {
      console.error('EmailJS error (user reply):', err);
      alert('Failed to send form to owner. Please check internet or try later.');
      btn.innerText = 'Failed';
      setTimeout(() => {
        btn.innerText = 'Send Message 🚀';
      }, 2000);
    });
});
