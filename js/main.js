(function ($) {
    "use strict";

    var mobileToggle = document.querySelector(".mobile-menu-toggle");
    var mobileClose = document.querySelector(".mobile-menu-close");
    var mobileOverlay = document.querySelector(".mobile-menu-overlay");

    function openMobileMenu() {
        document.body.classList.add("mobile-menu-open");

        if (mobileToggle) {
            mobileToggle.setAttribute("aria-expanded", "true");
        }
    }

    function closeMobileMenu() {
        document.body.classList.remove("mobile-menu-open");

        if (mobileToggle) {
            mobileToggle.setAttribute("aria-expanded", "false");
        }
    }
    
    if (mobileToggle) {
        mobileToggle.addEventListener("click", openMobileMenu);
    }

    if (mobileClose) {
        mobileClose.addEventListener("click", closeMobileMenu);
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener("click", closeMobileMenu);
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeMobileMenu();
        }
    });

    // Smooth scrolling on navigation links without persistent active states
    document.querySelectorAll('.sidebar .nav-link[href^="#"], .mobile-menu-links a[href^="#"], .mobile-brand[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            var targetId = this.getAttribute('href');
            var target = document.querySelector(targetId);
            var offset = window.matchMedia("(max-width: 991px)").matches ? 88 : 24;

            if (!target) {
                return;
            }

            event.preventDefault();
            closeMobileMenu();

            window.scrollTo({
                top: target.getBoundingClientRect().top + window.pageYOffset - offset,
                behavior: 'smooth'
            });

            history.pushState(null, '', targetId);
        });
    });
    

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        return false;
    });
})(jQuery);
