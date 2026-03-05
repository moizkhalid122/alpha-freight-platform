// Alpha Freight - Custom JavaScript

const COUNTRY_SETTINGS = Object.freeze({
    UK: {
        code: 'UK',
        label: 'United Kingdom',
        currencySymbol: '£',
        currencyCode: 'GBP',
        locale: 'en-GB',
        measurementSystem: 'imperial',
        distanceUnit: 'mi',
        weightUnit: 'tonnes',
        fuelUnit: 'litres'
    },
    USA: {
        code: 'USA',
        label: 'United States',
        currencySymbol: '$',
        currencyCode: 'USD',
        locale: 'en-US',
        measurementSystem: 'imperial',
        distanceUnit: 'mi',
        weightUnit: 'lbs',
        fuelUnit: 'gallons'
    },
    Germany: {
        code: 'Germany',
        label: 'Germany',
        currencySymbol: '€',
        currencyCode: 'EUR',
        locale: 'de-DE',
        measurementSystem: 'metric',
        distanceUnit: 'km',
        weightUnit: 'tonnes',
        fuelUnit: 'litres'
    },
    Australia: {
        code: 'Australia',
        label: 'Australia',
        currencySymbol: 'A$',
        currencyCode: 'AUD',
        locale: 'en-AU',
        measurementSystem: 'metric',
        distanceUnit: 'km',
        weightUnit: 'tonnes',
        fuelUnit: 'litres'
    },
    UAE: {
        code: 'UAE',
        label: 'United Arab Emirates',
        currencySymbol: 'AED',
        currencyCode: 'AED',
        locale: 'en-AE',
        measurementSystem: 'metric',
        distanceUnit: 'km',
        weightUnit: 'tonnes',
        fuelUnit: 'litres'
    }
});

document.addEventListener('DOMContentLoaded', function() {
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            // Check if targetId is valid (not just '#' or empty)
            if (!targetId || targetId === '#' || targetId.length <= 1) {
                return;
            }
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar scroll effect with smooth transition + scroll progress
    const navbar = document.querySelector('.navbar');
    const scrollProgress = document.querySelector('.scroll-progress');
    if (navbar) {
        let lastScroll = 0;
        const updateScrollProgress = () => {
            if (!scrollProgress) {
                return;
            }
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            scrollProgress.style.width = `${progress}%`;
        };

        window.addEventListener('scroll', function() {
            const currentScroll = window.scrollY;
            
            if (currentScroll > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }

            updateScrollProgress();
            
            lastScroll = currentScroll;
        }, { passive: true });

        updateScrollProgress();
    }

    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        const heroContent = heroSection.querySelector('.container');
        if (heroContent) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * 0.5;
                if (scrolled < window.innerHeight) {
                    heroContent.style.transform = `translateY(${rate}px)`;
                    heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
                }
            }, { passive: true });
        }
    }

    // Hero video rotation (play each video once, then move to next)
    const heroVideos = Array.from(document.querySelectorAll('.hero-video-background'));
    if (heroVideos.length) {
        let activeIndex = 0;
        let rotationTimeout = null;

        const clearRotationTimeout = () => {
            if (rotationTimeout) {
                clearTimeout(rotationTimeout);
                rotationTimeout = null;
            }
        };

        const activateVideo = (index) => {
            heroVideos.forEach((video, i) => {
                if (i === index) {
                    video.classList.add('is-active');
                    const playPromise = video.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(() => {});
                    }
                } else {
                    video.classList.remove('is-active');
                    video.pause();
                    video.currentTime = 0;
                }
            });
        };

        const playNextVideo = () => {
            activeIndex = (activeIndex + 1) % heroVideos.length;
            activateVideo(activeIndex);
            scheduleFallbackAdvance(heroVideos[activeIndex]);
        };

        const scheduleFallbackAdvance = (video) => {
            clearRotationTimeout();
            const fallbackSeconds = 18;
            const duration = Number.isFinite(video.duration) && video.duration > 1
                ? Math.ceil(video.duration) + 1
                : fallbackSeconds;
            rotationTimeout = setTimeout(playNextVideo, duration * 1000);
        };

        heroVideos.forEach((video) => {
            video.addEventListener('ended', playNextVideo);
            video.addEventListener('loadedmetadata', () => {
                if (video.classList.contains('is-active')) {
                    scheduleFallbackAdvance(video);
                }
            });
        });

        activateVideo(activeIndex);
        scheduleFallbackAdvance(heroVideos[activeIndex]);
    }

    // Quote form handling (EmailJS)
    const quoteForm = document.querySelector('.quote-form');
    if (quoteForm) {
        const EMAILJS_SERVICE_ID = 'service_mvxwoue';
        const EMAILJS_TEMPLATE_ID = 'template_21isokf';
        const EMAILJS_PUBLIC_KEY = 'f5bWSTVw5Z8mVVwTu';

        if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
        }

        quoteForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;

            if (!window.emailjs || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
                showAlert('danger', 'Email service is not configured yet. Please try again later.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            const nameField = this.querySelector('[name="customer_name"]');
            const emailField = this.querySelector('[name="customer_email"]');
            const pickupField = this.querySelector('[name="pickup_location"]');
            const deliveryField = this.querySelector('[name="delivery_location"]');
            const cargoField = this.querySelector('[name="cargo_weight"]');
            const dateField = this.querySelector('[name="delivery_date"]');
            const notesField = this.querySelector('[name="additional_requirements"]');

            const customerName = nameField ? nameField.value : '';
            const customerEmail = emailField ? emailField.value : '';

            const templateParams = {
                customer_name: customerName,
                customer_email: customerEmail,
                pickup_location: pickupField ? pickupField.value : '',
                delivery_location: deliveryField ? deliveryField.value : '',
                cargo_weight: cargoField ? cargoField.value : '',
                delivery_date: dateField ? dateField.value : '',
                additional_requirements: notesField ? notesField.value : '',
                from_name: customerName,
                from_email: customerEmail,
                reply_to: customerEmail,
                to_name: customerName || 'Customer',
                to_email: customerEmail
            };

            const timeoutMs = 15000;
            let timedOut = false;
            const timeoutId = setTimeout(() => {
                timedOut = true;
                showAlert('danger', 'Request timed out. Please check your connection and try again.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, timeoutMs);

            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
                .then(() => {
                    if (timedOut) {
                        return;
                    }
                    showAlert('success', 'Thank you! Your quote request has been submitted. We will contact you within 24 hours.');
                    this.reset();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                })
                .catch((error) => {
                    if (timedOut) {
                        return;
                    }
                    console.error('EmailJS error:', error);
                    const errorText = error && error.text ? ` (${error.text})` : '';
                    showAlert('danger', `We could not send your request. Please try again in a moment.${errorText}`);
                })
                .finally(() => {
                    if (timedOut) {
                        return;
                    }
                    clearTimeout(timeoutId);
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!this.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            this.classList.add('was-validated');
        });
    });

    // Stripe-like Scroll Animations with Intersection Observer
    const initScrollAnimations = () => {
        // Animation options
        const animationOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -80px 0px'
        };

        // Create main observer for scroll animations
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    // Unobserve after animation to improve performance
                    scrollObserver.unobserve(entry.target);
                }
            });
        }, animationOptions);

        // Animate stat cards with stagger
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.classList.add('fade-in-up');
            card.style.transitionDelay = `${index * 0.15}s`;
            scrollObserver.observe(card);
        });

        // Animate service cards with stagger (slide-in left/right)
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach((card, index) => {
            card.classList.add(index % 2 === 0 ? 'slide-in-left' : 'slide-in-right');
            card.style.transitionDelay = `${index * 0.2}s`;
            scrollObserver.observe(card);
        });

        // Animate gallery items with stagger
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach((item, index) => {
            item.classList.add('fade-in-up');
            item.style.transitionDelay = `${index * 0.1}s`;
            scrollObserver.observe(item);
        });

        // Animate testimonial cards with stagger
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        testimonialCards.forEach((card, index) => {
            card.classList.add('fade-in-up');
            card.style.transitionDelay = `${index * 0.2}s`;
            scrollObserver.observe(card);
        });

        // Animate section headings
        const sectionHeadings = document.querySelectorAll('section h2, section .display-5, section .display-6');
        sectionHeadings.forEach(heading => {
            heading.classList.add('fade-in-up');
            scrollObserver.observe(heading);
        });

        // Animate section descriptions
        const sectionDescriptions = document.querySelectorAll('section .lead');
        sectionDescriptions.forEach(desc => {
            desc.classList.add('fade-in-up');
            scrollObserver.observe(desc);
        });

        // Animate supplier and carrier sections
        const supplierImage = document.querySelector('.supplier-image');
        const carrierImage = document.querySelector('.carrier-image');
        if (supplierImage) {
            supplierImage.classList.add('fade-in-left');
            scrollObserver.observe(supplierImage);
        }
        if (carrierImage) {
            carrierImage.classList.add('fade-in-right');
            scrollObserver.observe(carrierImage);
        }

        // Animate contact cards
        const contactCards = document.querySelectorAll('.contact-card');
        contactCards.forEach((card, index) => {
            card.classList.add('scale-in');
            card.style.transitionDelay = `${index * 0.15}s`;
            scrollObserver.observe(card);
        });

        // Animate timeline items (already handled separately, but ensure they're observed)
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach(item => {
            if (!item.classList.contains('is-active')) {
                item.classList.add('fade-in-up');
                scrollObserver.observe(item);
            }
        });
    };

    // Initialize scroll animations
    initScrollAnimations();

    // Counter animation for stats
    const statNumbers = document.querySelectorAll('.stat-number');
    const animateCounters = () => {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count') || stat.textContent.replace(/\D/g, ''));
            const suffix = stat.getAttribute('data-suffix') || '';
            if (target > 0) {
                animateCounter(stat, target, suffix);
            }
        });
    };

    const animateCounter = (element, target, suffix) => {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current) + suffix;
        }, 30);
    };

    // Trigger counter animation when stats section is visible
    const statsSection = document.querySelector('.trust-stats');
    if (statsSection) {
        const statsObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        statsObserver.observe(statsSection);
    }

    // Comparison slider (before/after)
    const comparisonSlider = document.querySelector('.comparison-slider');
    const comparisonCard = document.querySelector('.comparison-card');
    if (comparisonSlider && comparisonCard) {
        const comparisonAfter = comparisonCard.querySelector('.comparison-after');
        const comparisonHandle = comparisonCard.querySelector('.comparison-handle');

        const updateComparison = (value) => {
            const percent = `${value}%`;
            comparisonCard.style.setProperty('--reveal', percent);
            if (comparisonAfter) {
                comparisonAfter.style.setProperty('--reveal', percent);
            }
            if (comparisonHandle) {
                comparisonHandle.style.left = percent;
            }
        };

        updateComparison(comparisonSlider.value);
        comparisonSlider.addEventListener('input', (event) => {
            updateComparison(event.target.value);
        });
    }

    // Mobile menu close on link click
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navbarLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    if (navbarToggler && navbarCollapse && navbarLinks.length > 0) {
        navbarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navbarCollapse.classList.contains('show')) {
                    navbarToggler.click();
                }
            });
        });
    }

    // Add loading states to buttons (exclude quote button to avoid spinner)
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.type === 'submit') {
                if (!this.classList.contains('quote-now-btn')) {
                    this.classList.add('loading');
                }
            }
        });
    });

    // Initialize tooltips (if Bootstrap tooltips are used)
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Initialize popovers (if Bootstrap popovers are used)
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }

    // Freight timeline activation on scroll
    const freightTimeline = document.querySelector('.freight-timeline');
    if (freightTimeline) {
        const timelineStack = freightTimeline.querySelector('.timeline-stack');
        const timelineItems = Array.from(freightTimeline.querySelectorAll('.timeline-item'));
        const progressLine = freightTimeline.querySelector('.timeline-progress');

        if (timelineStack && timelineItems.length > 0 && progressLine) {
            let highestStepReached = 0; // Track the highest step reached to prevent backward movement
            let currentProgressHeight = 0; // Track current progress line height

            const updateProgress = (activeIndex = 0) => {
                const stackHeight = timelineStack.offsetHeight;
                if (activeIndex >= timelineItems.length - 1) {
                    const finalHeight = stackHeight;
                    if (finalHeight > currentProgressHeight) {
                        progressLine.style.height = `${finalHeight}px`;
                        currentProgressHeight = finalHeight;
                    }
                    return;
                }

                const target = timelineItems[activeIndex];
                const marker = target.querySelector('.timeline-marker');
                const offsetValue = target.offsetTop + ((marker ? marker.offsetHeight : 0) / 2);
                
                // Only update if moving forward (prevent backward movement)
                if (offsetValue > currentProgressHeight) {
                    progressLine.style.height = `${offsetValue}px`;
                    currentProgressHeight = offsetValue;
                }
            };

            const activateStep = (index) => {
                // Only allow forward progression - don't go backward
                if (index < highestStepReached) {
                    return;
                }
                
                highestStepReached = Math.max(highestStepReached, index);
                
                timelineItems.forEach((item, itemIndex) => {
                    item.classList.toggle('is-active', itemIndex === index);
                    item.classList.toggle('is-complete', itemIndex < index);
                });
                updateProgress(index);
            };

            const timelineObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const stepIndex = Number(entry.target.dataset.step) || 0;
                        activateStep(stepIndex);
                    }
                });
            }, { threshold: 0.6, rootMargin: '-10% 0px -10% 0px' });

            timelineItems.forEach(item => timelineObserver.observe(item));

            window.addEventListener('resize', () => {
                const activeIndex = timelineItems.findIndex(item => item.classList.contains('is-active'));
                if (activeIndex >= 0) {
                    updateProgress(activeIndex);
                } else {
                    updateProgress(highestStepReached);
                }
            });

            activateStep(0);
        }
    }

    // Smooth reveal animation for elements entering viewport
    const revealElements = document.querySelectorAll('.animate-on-scroll');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // Add smooth scroll behavior with offset for fixed navbar
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Performance optimization: Use requestAnimationFrame for scroll events
    let ticking = false;
    const optimizedScrollHandler = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // Scroll-based animations can be added here
                ticking = false;
            });
            ticking = true;
        }
    };
    
    window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

});

// Utility Functions

// Show alert messages
function showAlert(type, message) {
    // Normalize to Bootstrap types
    const typeMap = { error: 'danger', success: 'success', info: 'info', warning: 'warning' };
    const bsType = typeMap[type] || 'info';

    const wrapper = document.createElement('div');
    wrapper.className = `ab-alert alert alert-${bsType} alert-dismissible fade show position-fixed`;
    wrapper.style.cssText = 'top: 100px; right: 20px; z-index: 10010; min-width: 320px;';

    const icons = {
        success: '<i class="fas fa-check-circle me-2"></i>',
        info: '<i class="fas fa-info-circle me-2"></i>',
        warning: '<i class="fas fa-exclamation-triangle me-2"></i>',
        danger: '<i class="fas fa-times-circle me-2"></i>'
    };
    const icon = icons[bsType] || icons.info;

    wrapper.innerHTML = `
        <div class="d-flex align-items-start">
            <div class="me-2 alert-icon">${icon}</div>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>
        </div>
    `;

    document.body.appendChild(wrapper);

    setTimeout(() => {
        if (wrapper && wrapper.parentNode) {
            try { new bootstrap.Alert(wrapper).close(); } catch(e) { wrapper.remove(); }
        }
    }, 4000);
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone number (UK format)
function validatePhone(phone) {
    const re = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Format phone number
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{3})$/);
    if (match) {
        return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
    return phone;
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Local storage helpers
const storage = {
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage', e);
        }
    },
    
    get: function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error reading from localStorage', e);
            return null;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage', e);
        }
    }
};

function normalizeCountry(country) {
    if (!country && country !== 0) {
        return 'UK';
    }
    const value = String(country).trim().toLowerCase();
    if (!value) {
        return 'UK';
    }
    if (['united kingdom', 'uk', 'great britain', 'gb', 'england'].includes(value)) {
        return 'UK';
    }
    if (['united states', 'united states of america', 'usa', 'us', 'america'].includes(value)) {
        return 'USA';
    }
    if (['germany', 'deutschland', 'de'].includes(value)) {
        return 'Germany';
    }
    if (['australia', 'au', 'aus'].includes(value)) {
        return 'Australia';
    }
    if (['united arab emirates', 'uae', 'ae', 'dubai'].includes(value)) {
        return 'UAE';
    }
    const match = Object.keys(COUNTRY_SETTINGS).find(key => key.toLowerCase() === value);
    return match || 'UK';
}

function getCountrySettings(country) {
    const key = normalizeCountry(country);
    return COUNTRY_SETTINGS[key] || COUNTRY_SETTINGS.UK;
}

function formatCurrency(amount, options) {
    const opts = options || {};
    const settings = opts.settings || getCountrySettings(opts.country);
    if (amount === null || amount === undefined || amount === '') {
        if (opts.fallback !== undefined) {
            return opts.fallback;
        }
        return `${settings.currencySymbol}0`;
    }

    let numericAmount;
    if (typeof amount === 'number') {
        numericAmount = amount;
    } else if (typeof amount === 'string') {
        numericAmount = parseFloat(amount.replace(/,/g, ''));
    } else {
        numericAmount = parseFloat(amount);
    }

    if (Number.isNaN(numericAmount)) {
        if (opts.fallback !== undefined) {
            return opts.fallback;
        }
        return `${settings.currencySymbol}${amount}`;
    }

    const minDigits = opts.minimumFractionDigits !== undefined ? opts.minimumFractionDigits : 2;
    const maxDigits = opts.maximumFractionDigits !== undefined ? opts.maximumFractionDigits : 2;

    try {
        return new Intl.NumberFormat(settings.locale, {
            style: 'currency',
            currency: settings.currencyCode,
            minimumFractionDigits: minDigits,
            maximumFractionDigits: maxDigits
        }).format(numericAmount);
    } catch (err) {
        const digits = Number.isFinite(maxDigits) ? maxDigits : 2;
        return `${settings.currencySymbol}${numericAmount.toFixed(digits)}`;
    }
}

function getMeasurementUnits(country) {
    const settings = getCountrySettings(country);
    return {
        system: settings.measurementSystem,
        distance: settings.distanceUnit,
        weight: settings.weightUnit,
        fuel: settings.fuelUnit
    };
}

function applyCurrencySymbols(root, country) {
    if (typeof document === 'undefined') {
        return;
    }
    const settings = getCountrySettings(country);
    const scope = root || document;
    scope.querySelectorAll('[data-currency-symbol]').forEach(el => {
        el.textContent = settings.currencySymbol;
    });
}

function applyMeasurementUnits(root, country) {
    if (typeof document === 'undefined') {
        return;
    }
    const units = getMeasurementUnits(country);
    const scope = root || document;
    scope.querySelectorAll('[data-distance-unit]').forEach(el => { el.textContent = units.distance; });
    scope.querySelectorAll('[data-weight-unit]').forEach(el => { el.textContent = units.weight; });
    scope.querySelectorAll('[data-fuel-unit]').forEach(el => { el.textContent = units.fuel; });
    scope.querySelectorAll('[data-measurement-system]').forEach(el => { el.textContent = units.system; });
}

function resolveAuthCountry(role) {
    let storageKey = null;
    if (role === 'carrier') {
        storageKey = 'carrierAuth';
    } else if (role === 'supplier') {
        storageKey = 'supplierAuth';
    }
    if (!storageKey) {
        return null;
    }
    const stored = storage.get(storageKey);
    if (stored && stored.country) {
        return stored.country;
    }
    try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.country) {
                return parsed.country;
            }
        }
    } catch (err) {
        console.error('Error resolving auth country', err);
    }
    return null;
}

function getUserSettings(role) {
    let country = resolveAuthCountry(role);
    if (!country) {
        try {
            const lastRole = localStorage.getItem('ab.portal.lastRole');
            if (lastRole && lastRole !== role) {
                country = resolveAuthCountry(lastRole);
            }
        } catch (err) {
            console.error('Error reading last role from storage', err);
        }
    }
    return getCountrySettings(country);
}

function formatNumberWithLocale(amount, options) {
    const opts = options || {};
    const settings = opts.settings || getCountrySettings(opts.country);
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (Number.isNaN(numericAmount)) {
        return amount;
    }
    try {
        return new Intl.NumberFormat(settings.locale, {
            minimumFractionDigits: opts.minimumFractionDigits,
            maximumFractionDigits: opts.maximumFractionDigits
        }).format(numericAmount);
    } catch (err) {
        const digits = opts.maximumFractionDigits !== undefined ? opts.maximumFractionDigits : 2;
        return numericAmount.toFixed(digits);
    }
}

function createRegionalContext(role) {
    let settings = Object.assign({}, getUserSettings(role));

    function withSettings(options) {
        return Object.assign({ settings }, options || {});
    }

    function refresh() {
        settings = Object.assign({}, getUserSettings(role));
        return settings;
    }

    function getSettings() {
        return settings;
    }

    function formatCurrencyLocal(value, options) {
        return formatCurrency(value, withSettings(options));
    }

    function formatNumberLocal(value, options) {
        return formatNumberWithLocale(value, withSettings(options));
    }

    function getUnits() {
        return getMeasurementUnits(settings.code);
    }

    function formatWeight(value, options) {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        const units = getUnits();
        const numeric = parseFloat(value);
        if (Number.isNaN(numeric)) {
            return `${value} ${units.weight}`.trim();
        }
        let converted = numeric;
        if (units.weight === 'lbs') {
            converted = numeric * 2204.62262;
        }
        const defaults = units.weight === 'lbs'
            ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
            : { minimumFractionDigits: 1, maximumFractionDigits: 1 };
        const formatted = formatNumberLocal(converted, Object.assign({}, defaults, options));
        return `${formatted} ${units.weight}`.trim();
    }

    function formatDistance(value, options) {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        const units = getUnits();
        const numeric = parseFloat(value);
        if (Number.isNaN(numeric)) {
            return `${value} ${units.distance}`.trim();
        }
        let converted = numeric;
        if (units.distance === 'mi') {
            converted = numeric * 0.621371;
        }
        const formatted = formatNumberLocal(converted, Object.assign({ maximumFractionDigits: 1 }, options));
        return `${formatted} ${units.distance}`.trim();
    }

    return {
        getSettings,
        refresh,
        formatCurrency: formatCurrencyLocal,
        formatNumber: formatNumberLocal,
        formatWeight,
        formatDistance,
        getUnits
    };
}

// API helper functions (for future backend integration)
const api = {
    baseUrl: 'https://api.alphabrokrage.co.uk', // Replace with actual API URL
    
    post: async function(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API POST error:', error);
            throw error;
        }
    },
    
    get: async function(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API GET error:', error);
            throw error;
        }
    }
};

// Export functions for use in other scripts
window.AlphaBrokrage = {
    showAlert,
    validateEmail,
    validatePhone,
    formatPhoneNumber,
    debounce,
    storage,
    api,
    countrySettings: COUNTRY_SETTINGS,
    getCountrySettings,
    getUserSettings,
    formatCurrency,
    formatNumberWithLocale,
    createRegionalContext,
    getMeasurementUnits,
    applyCurrencySymbols,
    applyMeasurementUnits
};

// Carrier location-on guard for pending loads
function initCarrierLocationGuard() {
    const path = window.location.pathname.replace(/\\/g, '/');
    const isCarrierPage = path.includes('/carrier/');
    const isDriverPanel = path.includes('/driver/panel');
    if (!isCarrierPage && !isDriverPanel) {
        return;
    }
    if (path.includes('/carrier/login') || path.includes('/carrier/register') || path.includes('/carrier/complete-profile')) {
        return;
    }
    let auth = null;
    try {
        auth = JSON.parse(localStorage.getItem('carrierAuth') || 'null');
    } catch (err) {
        auth = null;
    }
    if (!auth || auth.isLoggedIn === false) {
        return;
    }
    const carrierId = auth.carrierId || auth.carrier_id || auth.id;
    if (!carrierId) {
        return;
    }

    const pendingStatuses = new Set(['pending', 'accepted', 'picked-up', 'in-transit', 'on-route', 'active']);

    function hasPendingStatus(load) {
        const status = (load && load.status ? String(load.status) : '').toLowerCase();
        return pendingStatuses.has(status);
    }

    function getLocationSharingState() {
        try {
            const state = JSON.parse(localStorage.getItem('carrierLocationSharing') || 'null');
            return !!(state && state.on);
        } catch (err) {
            return false;
        }
    }

    function ensureOverlay() {
        let overlay = document.getElementById('carrierLocationGuard');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'carrierLocationGuard';
        overlay.innerHTML = `
            <div class="guard-card">
                <div class="guard-icon"><i class="fas fa-location-dot"></i></div>
                <h4>Location Required</h4>
                <p>Please turn on location because your order is pending. You can access the portal once location is enabled.</p>
                <div class="guard-actions">
                    <button class="btn btn-primary" type="button" id="guardEnableLocationBtn"><i class="fas fa-location-crosshairs me-2"></i>Turn On Location</button>
                </div>
                <div class="guard-error d-none" id="guardLocationError"></div>
            </div>
        `;
        const style = document.createElement('style');
        style.textContent = `
            #carrierLocationGuard {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.72);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 1.5rem;
                backdrop-filter: blur(6px);
            }
            #carrierLocationGuard .guard-card {
                max-width: 520px;
                width: 100%;
                background: #fff;
                border-radius: 18px;
                padding: 1.75rem 2rem;
                box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
                text-align: center;
            }
            #carrierLocationGuard .guard-icon {
                width: 64px;
                height: 64px;
                border-radius: 16px;
                margin: 0 auto 1rem;
                background: rgba(37, 99, 235, 0.12);
                color: #2563eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.6rem;
            }
            #carrierLocationGuard h4 {
                margin-bottom: 0.6rem;
                color: #0f172a;
                font-weight: 700;
            }
            #carrierLocationGuard p {
                color: #475569;
                margin-bottom: 1.4rem;
            }
            #carrierLocationGuard .guard-actions {
                display: flex;
                gap: 0.75rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            #carrierLocationGuard .guard-error {
                margin-top: 0.85rem;
                color: #dc2626;
                font-size: 0.85rem;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        const enableBtn = overlay.querySelector('#guardEnableLocationBtn');
        if (enableBtn) {
            enableBtn.addEventListener('click', function() {
                requestLocation(enableBtn);
            });
        }
        return overlay;
    }

    function setOverlayVisible(visible) {
        const overlay = ensureOverlay();
        overlay.style.display = visible ? 'flex' : 'none';
        document.body.style.overflow = visible ? 'hidden' : '';
    }

    function checkLoadsFromLocalStorage() {
        let loads = [];
        try {
            loads = JSON.parse(localStorage.getItem('carrierLoads') || '[]');
        } catch (err) {
            loads = [];
        }
        if (!Array.isArray(loads) || loads.length === 0) {
            try {
                const globalLoads = JSON.parse(localStorage.getItem('globalLoads') || '[]');
                if (Array.isArray(globalLoads)) {
                    loads = globalLoads.filter(load => {
                        const loadCarrierId = load.carrierId || load.carrier_id;
                        return loadCarrierId && String(loadCarrierId) === String(carrierId);
                    });
                }
            } catch (err) {
                loads = [];
            }
        }
        return loads.some(load => {
            const loadCarrierId = load.carrierId || load.carrier_id;
            return loadCarrierId && String(loadCarrierId) === String(carrierId) && hasPendingStatus(load);
        });
    }

    function checkLoadsFromFirebase() {
        return new Promise(resolve => {
            if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
                resolve(checkLoadsFromLocalStorage());
                return;
            }
            const db = firebase.database();
            const carrierIdValue = String(carrierId);
            const query1 = db.ref('loads').orderByChild('carrierId').equalTo(carrierIdValue).once('value');
            const query2 = db.ref('loads').orderByChild('carrier_id').equalTo(carrierIdValue).once('value');
            Promise.all([query1, query2]).then(results => {
                let hasPending = false;
                results.forEach(snapshot => {
                    if (!snapshot || !snapshot.exists()) return;
                    snapshot.forEach(child => {
                        if (hasPending) return;
                        const load = child.val();
                        if (hasPendingStatus(load)) {
                            hasPending = true;
                        }
                    });
                });
                resolve(hasPending);
            }).catch(() => {
                resolve(checkLoadsFromLocalStorage());
            });
        });
    }

    function resolvePendingLoadId() {
        const carrierIdValue = String(carrierId);
        const pendingLoads = [];
        function considerLoad(loadId, load) {
            if (!loadId || !hasPendingStatus(load)) return;
            const ts = load.updatedAt || load.acceptedAt || load.createdAt || 0;
            pendingLoads.push({ id: loadId, ts: ts });
        }
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            const db = firebase.database();
            const query1 = db.ref('loads').orderByChild('carrierId').equalTo(carrierIdValue).once('value');
            const query2 = db.ref('loads').orderByChild('carrier_id').equalTo(carrierIdValue).once('value');
            return Promise.all([query1, query2]).then(results => {
                results.forEach(snapshot => {
                    if (!snapshot || !snapshot.exists()) return;
                    snapshot.forEach(child => {
                        considerLoad(child.key, child.val());
                    });
                });
                if (!pendingLoads.length) return null;
                pendingLoads.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
                return pendingLoads[0].id;
            }).catch(() => {
                return resolvePendingLoadIdFromStorage();
            });
        }
        return Promise.resolve(resolvePendingLoadIdFromStorage());
    }

    function resolvePendingLoadIdFromStorage() {
        let loads = [];
        try {
            loads = JSON.parse(localStorage.getItem('carrierLoads') || '[]');
        } catch (err) {
            loads = [];
        }
        if (!Array.isArray(loads) || loads.length === 0) {
            try {
                const globalLoads = JSON.parse(localStorage.getItem('globalLoads') || '[]');
                if (Array.isArray(globalLoads)) {
                    loads = globalLoads.filter(load => {
                        const loadCarrierId = load.carrierId || load.carrier_id;
                        return loadCarrierId && String(loadCarrierId) === String(carrierId);
                    });
                }
            } catch (err) {
                loads = [];
            }
        }
        const pending = loads.filter(load => hasPendingStatus(load));
        if (!pending.length) return null;
        pending.sort((a, b) => new Date(b.updatedAt || b.acceptedAt || b.createdAt || 0).getTime()
            - new Date(a.updatedAt || a.acceptedAt || a.createdAt || 0).getTime());
        return pending[0].id || pending[0].loadId || null;
    }

    let locationWatchId = null;
    let activeLocationLoadId = null;

    function publishLocation(loadId, coords) {
        if (!loadId || typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            return;
        }
        const db = firebase.database();
        const payload = {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy || null,
            altitude: coords.altitude || null,
            speed: typeof coords.speed === 'number' ? Number(coords.speed.toFixed(2)) : null,
            heading: typeof coords.heading === 'number' ? Number(coords.heading.toFixed(2)) : null,
            updatedAt: Date.now()
        };
        db.ref(`loadLocations/${loadId}/${carrierId}`).set(payload).catch(() => {
            // ignore write failures for now
        });
    }

    function startLocationWatch(loadId) {
        if (!('geolocation' in navigator)) return;
        if (locationWatchId !== null) return;
        if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) return;
        activeLocationLoadId = loadId;
        locationWatchId = navigator.geolocation.watchPosition(function(pos) {
            publishLocation(activeLocationLoadId, pos.coords);
            try {
                localStorage.setItem('carrierLocationSharing', JSON.stringify({
                    on: true,
                    updatedAt: new Date().toISOString(),
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                }));
            } catch (_) {}
        }, function(err) {
            locationWatchId = null;
        }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 });
    }

    function stopLocationWatch() {
        if (locationWatchId !== null) {
            navigator.geolocation.clearWatch(locationWatchId);
            locationWatchId = null;
        }
        activeLocationLoadId = null;
    }

    function refreshGuard() {
        checkLoadsFromFirebase().then(hasPending => {
            const locationOn = getLocationSharingState();
            if (hasPending && !locationOn) {
                setOverlayVisible(true);
            } else {
                setOverlayVisible(false);
            }
            if (hasPending && locationOn && locationWatchId === null) {
                resolvePendingLoadId().then(loadId => {
                    if (loadId) {
                        startLocationWatch(loadId);
                    }
                });
            }
            if (!hasPending && locationWatchId !== null) {
                stopLocationWatch();
            }
        });
    }

    function requestLocation(buttonEl) {
        const errorEl = document.getElementById('guardLocationError');
        if (errorEl) {
            errorEl.classList.add('d-none');
            errorEl.textContent = '';
        }
        if (!('geolocation' in navigator)) {
            if (errorEl) {
                errorEl.textContent = 'Geolocation is not supported on this device.';
                errorEl.classList.remove('d-none');
            }
            return;
        }
        if (buttonEl) {
            buttonEl.disabled = true;
            buttonEl.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Turning On...';
        }
        navigator.geolocation.getCurrentPosition(function(pos) {
            try {
                localStorage.setItem('carrierLocationSharing', JSON.stringify({
                    on: true,
                    updatedAt: new Date().toISOString(),
                    lat: pos.coords && pos.coords.latitude,
                    lng: pos.coords && pos.coords.longitude
                }));
            } catch (_) {}
            if (buttonEl) {
                buttonEl.disabled = false;
                buttonEl.innerHTML = '<i class="fas fa-location-crosshairs me-2"></i>Turn On Location';
            }
            resolvePendingLoadId().then(loadId => {
                if (loadId) {
                    publishLocation(loadId, pos.coords);
                    startLocationWatch(loadId);
                    refreshGuard();
                } else {
                    if (errorEl) {
                        errorEl.textContent = 'Pending load not found. Please refresh and try again.';
                        errorEl.classList.remove('d-none');
                    }
                    refreshGuard();
                }
            });
        }, function(err) {
            if (errorEl) {
                errorEl.textContent = err && err.code === 1
                    ? 'Location permission denied. Please allow location access.'
                    : 'Unable to access location. Please try again.';
                errorEl.classList.remove('d-none');
            }
            if (buttonEl) {
                buttonEl.disabled = false;
                buttonEl.innerHTML = '<i class="fas fa-location-crosshairs me-2"></i>Turn On Location';
            }
        }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
    }

    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
            if (result && result.state === 'denied') {
                try {
                    localStorage.setItem('carrierLocationSharing', JSON.stringify({ on: false, updatedAt: new Date().toISOString() }));
                } catch (_) {}
            }
            refreshGuard();
        }).catch(refreshGuard);
    } else {
        refreshGuard();
    }
    setInterval(refreshGuard, 20000);
    window.addEventListener('storage', function(ev) {
        if (ev.key === 'carrierLocationSharing') {
            refreshGuard();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initCarrierLocationGuard();
});

// Commission calculation helpers (tiered: small/medium/big)
// Default config can be overridden by passing a custom config object
// Tiering is based on baseAmount (deal size) in GBP
window.AlphaBrokrage.determineCommissionTier = function(baseAmount, config) {
    const cfg = Object.assign({
        thresholds: { smallMax: 1000, mediumMax: 5000 }, // <=1000: small, 1000-5000: medium, >5000: big
        rates: { small: 0.10, medium: 0.15, big: 0.20 }
    }, config || {});

    let tier = 'small';
    if (typeof baseAmount !== 'number' || isNaN(baseAmount) || baseAmount <= 0) {
        return { tier: null, rateDecimal: 0 };
    }
    if (baseAmount <= cfg.thresholds.smallMax) {
        tier = 'small';
    } else if (baseAmount <= cfg.thresholds.mediumMax) {
        tier = 'medium';
    } else {
        tier = 'big';
    }
    const rateDecimal = cfg.rates[tier] ?? 0;
    return { tier, rateDecimal };
};

window.AlphaBrokrage.calculateCommission = function(baseAmount, config) {
    const { tier, rateDecimal } = window.AlphaBrokrage.determineCommissionTier(baseAmount, config);
    if (!tier) {
        return { amount: 0, tier: null, ratePercent: 0 };
    }
    const amount = Math.round((baseAmount * rateDecimal) * 100) / 100;
    return { amount, tier, ratePercent: Math.round(rateDecimal * 100) };
};

document.addEventListener('DOMContentLoaded', function() {
    if (!window.gsap) {
        return;
    }

    const splitTextIntoChars = (el) => {
        const originalText = el.textContent || '';
        const words = originalText.split(' ');
        const chars = words.map((word) => {
            const letters = word.split('').map((char) => `<span class="char">${char}</span>`).join('');
            return `<span class="word">${letters}</span>`;
        }).join('<span class="word-space">&nbsp;</span>');
        el.setAttribute('data-original-text', originalText);
        el.innerHTML = chars;
        return el.querySelectorAll('.char');
    };

    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

    fontsReady.then(() => {
        const section = document.querySelector('.headline-animate-section');
        const text = document.querySelector('.headline');
        if (!section || !text) {
            return;
        }

        gsap.set(text, { opacity: 1 });

        const chars = splitTextIntoChars(text);
        let intervalId = null;
        let isAnimating = false;

        const runHeadlineAnimation = () => {
            if (isAnimating) {
                return;
            }
            isAnimating = true;
            gsap.killTweensOf(chars);
            gsap.fromTo(chars, {
                opacity: 0,
                y: 40,
                rotation: -8,
                scale: 0.85
            }, {
                duration: 0.6,
                opacity: 1,
                y: 0,
                rotation: 0,
                scale: 1,
                ease: 'back.out(1.7)',
                stagger: 0.03,
                onComplete: () => {
                    isAnimating = false;
                    text.removeAttribute('aria-hidden');
                }
            });
        };

        const startAutoLoop = () => {
            if (intervalId) {
                return;
            }
            runHeadlineAnimation();
            intervalId = setInterval(runHeadlineAnimation, 10000);
        };

        const stopAutoLoop = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                startAutoLoop();
            } else {
                stopAutoLoop();
            }
        }, { threshold: 0.4 });

        observer.observe(section);
        // auto-play only (no manual trigger)
    });
});