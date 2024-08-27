class DarkMode {
    static enabled = false;

    static toggle() {
        DarkMode.enabled = !DarkMode.enabled;
        if (DarkMode.enabled) {
            DarkMode.enable();
        } else {
            DarkMode.disable();
        }
    }

    static enable() {
        document.body.style.backgroundColor = "rgb(30, 30, 30)";
        document.body.style.color = "#FCF5F5";

        // Apply styles to all divs that originally have a box shadow
        let divs = document.querySelectorAll("div");

        divs.forEach(div => {
            div.style.backgroundColor = "rgb(10, 15, 22)";
            div.style.color = "#FCF5F5";
            
            // Only apply box shadow if the div originally has one
            if (window.getComputedStyle(div).boxShadow !== 'none') {
                div.style.boxShadow = "0px 3px 10px 3px rgba(20, 255, 60, 0.1)";
            }
        });

        // Handle dynamically created images
        let images = document.querySelectorAll("img");
        images.forEach(img => {
            const originalSrc = img.getAttribute("src");
            if (originalSrc && !originalSrc.includes("_dm")) {
                const darkModeSrc = originalSrc.replace(".svg", "_dm.svg");
                img.setAttribute("src", darkModeSrc);
            }
        });

        let selects = document.querySelectorAll("select");
        selects.forEach(select => {
            select.style.backgroundColor = "rgb(10, 15, 22)";
            select.style.color = "#FCF5F5";
            select.style.borderColor = "rgb(50, 50, 50)";
        });

        let buttons = document.querySelectorAll("button");
        buttons.forEach(button => {
            button.style.backgroundColor = "rgb(50, 50, 50)";
            button.style.color = "#FCF5F5";
            button.style.borderColor = "rgb(70, 70, 70)";
        });
    }

    static disable() {
        document.body.style.backgroundColor = "white";
        document.body.style.color = "black";

        // Revert styles for all divs that originally have a box shadow
        let divs = document.querySelectorAll("div");

        divs.forEach(div => {
            div.style.backgroundColor = "white";
            div.style.color = "black";
            
            // Only revert box shadow if the div originally has one
            if (window.getComputedStyle(div).boxShadow !== 'none') {
                div.style.boxShadow = "0px 10px 15px 5px rgba(20, 255, 60, 0.2)";
            }
        });

        // Handle dynamically created images
        let images = document.querySelectorAll("img");
        images.forEach(img => {
            const darkModeSrc = img.getAttribute("src");
            if (darkModeSrc && darkModeSrc.includes("_dm")) {
                const originalSrc = darkModeSrc.replace("_dm.svg", ".svg");
                img.setAttribute("src", originalSrc);
            }
        });

        let selects = document.querySelectorAll("select");
        selects.forEach(select => {
            select.style.backgroundColor = "white";
            select.style.color = "black";
            select.style.borderColor = "rgb(200, 200, 200)";
        });

        let buttons = document.querySelectorAll("button");
        buttons.forEach(button => {
            button.style.backgroundColor = "white";
            button.style.color = "black";
            button.style.borderColor = "rgb(200, 200, 200)";
        });
    }
}

export { DarkMode };
