// main.js

document.addEventListener('DOMContentLoaded', function() {
    // Function to load and inject HTML components
    function loadComponent(componentPath, targetElementId) {
        fetch(componentPath)
            .then(response => response.text())
            .then(data => {
                document.getElementById(targetElementId).innerHTML = data;
            })
            .catch(error => console.error('Error loading component:', error));
    }

    // Load navbar and footer with path adjustment for blog post pages
    const isInBlogPost = window.location.pathname.includes('/blog/') && !window.location.pathname.endsWith('blog.html');
    const componentPath = isInBlogPost ? '../../components/' : '../components/';
    loadComponent(componentPath + 'navbar.html', 'navbar-container');
    loadComponent(componentPath + 'footer.html', 'footer-container');

    // Function to fetch JSON data and render cards
    async function fetchDataAndRenderCards(jsonPath, containerId, cardHtmlPath) {
        try {
            const response = await fetch(jsonPath);
            const data = await response.json();
            const container = document.getElementById(containerId);
            
            if (!container) {
                return; // Exit if the container isn't on the current page
            }

            const cardTemplateResponse = await fetch(cardHtmlPath);
            const cardTemplate = await cardTemplateResponse.text();

            container.innerHTML = ''; // Clear existing content

            data.forEach(item => {
                let cardContent = cardTemplate;
                
                // Process conditional blocks
                const conditionals = cardContent.match(/{{#if ([^}]+)}}([\s\S]*?){{\/if}}/g);
                if (conditionals) {
                    conditionals.forEach(block => {
                        const condField = block.match(/{{#if ([^}]+)}}/)[1];
                        const content = block.match(/{{#if [^}]+}}([\s\S]*?){{\/if}}/)[1];
                        
                        if (item[condField]) {
                            // Replace the entire conditional block with just its content
                            cardContent = cardContent.replace(block, content);
                        } else {
                            // Remove the entire conditional block
                            cardContent = cardContent.replace(block, '');
                        }
                    });
                }
                
                // Replace regular placeholders
                for (const key in item) {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    cardContent = cardContent.replace(regex, item[key]);
                }
                
                // Create a temporary div to append the card content so it's treated as HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardContent;
                container.appendChild(tempDiv.firstElementChild); // Append the card itself, not the tempDiv
            });
        } catch (error) {
            console.error('Error fetching or rendering data:', error);
            if (document.getElementById(containerId)) {
                 document.getElementById(containerId).innerHTML = '<p class="text-danger">Error loading content.</p>';
            }
        }
    }

    // Load data for different sections if their containers exist
    // The paths to JSON and card template are now relative to the pages in the 'pages' directory
    // The card template path is also adjusted.
    const jsonBasePath = isInBlogPost ? '../../data/' : '../data/';
    const componentsBasePath = isInBlogPost ? '../../components/' : '../components/';

    if (document.getElementById('tools-cards')) {
        fetchDataAndRenderCards(jsonBasePath + 'tools.json', 'tools-cards', componentsBasePath + 'card.html');
    }
    if (document.getElementById('tools-list')) { // For tools.html page
        fetchDataAndRenderCards(jsonBasePath + 'tools.json', 'tools-list', componentsBasePath + 'card.html');
    }
    if (document.getElementById('services-cards')) {
        // Special handling for services with icons
        fetch(jsonBasePath + 'services.json')
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('services-cards');
                container.innerHTML = ''; // Clear existing content
                
                // Service icon mapping
                const iconMap = {
                    'Cybersecurity Tutoring': 'fa-chalkboard-teacher',
                    'Security Assessment Services': 'fa-shield-alt',
                    'Incident Response Consulting': 'fa-ambulance',
                    'Workshops and Training': 'fa-users'
                };
                
                data.forEach(service => {
                    const icon = iconMap[service.name] || 'fa-laptop-code'; // Default icon
                    const serviceElement = document.createElement('div');
                    serviceElement.innerHTML = `
                        <div class="service-card">
                            <div class="service-icon">
                                <i class="fas ${icon}"></i>
                            </div>
                            <h3 class="service-title">${service.name}</h3>
                            <p>${service.description}</p>
                            
                        </div>
                    `; //<p class="service-price">${service.pricing}</p> should be movved to the function above when time is right
                    container.appendChild(serviceElement.firstElementChild);
                });
            })
            .catch(error => {
                console.error('Error loading services:', error);
                document.getElementById('services-cards').innerHTML = '<p class="text-danger">Error loading services.</p>';
            });
    }
    if (document.getElementById('blog-cards')) {
        loadBlogPosts(); 
    }

    // Specific function for blog posts with new styling
    function loadBlogPosts() {
        const blogContainer = document.getElementById('blog-cards');
        if (!blogContainer) return;

        fetch(jsonBasePath + 'blog-posts.json')
            .then(response => response.json())
            .then(data => {
                // Create a document fragment to batch DOM updates
                const fragment = document.createDocumentFragment();
                
                // Determine URL prefix once, outside the loop
                let postUrlPrefix = '';
                const path = window.location.pathname;

                if (path.endsWith('index.html') || path === '/' || path === '') {
                    postUrlPrefix = '/pages/blog/';
                } else if (path.endsWith('blog.html')) {
                    postUrlPrefix = 'blog/';
                }


                // Build all cards in memory first
                data.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'card';
                    postElement.innerHTML = `
                        <div class="card-body">
                            <h3 class="card-title">${post.title}</h3>
                            <p class="blog-date"><i class="far fa-calendar-alt"></i> ${post.date}</p>
                            <p class="card-text">${post.content.substring(0, 120)}...</p>
                            <div class="card-footer">
                                <a href="${postUrlPrefix}${post.slug}.html" class="btn btn-outline">READ MORE</a>
                            </div>
                        </div>
                    `;
                    fragment.appendChild(postElement);
                });

                // Clear the container and append all cards at once
                blogContainer.innerHTML = '';
                blogContainer.appendChild(fragment);
            })
            .catch(error => {
                console.error('Error loading blog posts:', error);
                blogContainer.innerHTML = '<p class="text-danger">Error loading blog posts.</p>';
            });
    }

    // Add scroll animations
    function setupScrollAnimations() {
        const elements = document.querySelectorAll('.fade-in');
        
        const appearOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };
        
        const appearOnScroll = new IntersectionObserver(function(entries, observer) {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    return;
                } else {
                    entry.target.style.opacity = 1;
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, appearOptions);
        
        elements.forEach(element => {
            element.style.opacity = 0;
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            appearOnScroll.observe(element);
        });
    }
    
    // Initialize scroll animations after DOM content is loaded
    if ('IntersectionObserver' in window) {
        setupScrollAnimations();
    }
});

/*
    * This script sets navbar and footer links dynamically for blog pages.
    * Place this code in ../../assets/js/main.js and remove it from individual HTML files.
    */
document.addEventListener("DOMContentLoaded", function() {
    // Only run on blog pages
    if (!window.location.pathname.includes("/blog/")) return;

    function setLinksWhenReady() {
        const footerLinks = [
            "footer-home", "footer-journey", "footer-tools", "footer-services", "footer-blog", "footer-contact"
        ];
        const navLinks = [
            "home-link", "about-link", "journey-link", "tools-link", "services-link", "blog-link", "contact-link"
        ];

        // Check if all elements exist
        const allFooterReady = footerLinks.every(id => document.getElementById(id));
        const allNavReady = navLinks.every(id => document.getElementById(id));

        if (allFooterReady && allNavReady) {
            document.getElementById("footer-home").href = "../../index.html";
            document.getElementById("footer-journey").href = "../journey.html";
            document.getElementById("footer-tools").href = "../tools.html";
            document.getElementById("footer-services").href = "../services.html";
            document.getElementById("footer-blog").href = "../blog.html";
            document.getElementById("footer-contact").href = "../contact.html";
            document.getElementById("home-link").href = "../../index.html";
            document.getElementById("about-link").href = "../../index.html#about";
            document.getElementById("journey-link").href = "../journey.html";
            document.getElementById("tools-link").href = "../tools.html";
            document.getElementById("services-link").href = "../services.html";
            document.getElementById("blog-link").href = "../blog.html";
            document.getElementById("contact-link").href = "../contact.html";
        } else {
            // Try again after a short delay
            setTimeout(setLinksWhenReady, 100);
        }
    }
    setLinksWhenReady();
});
