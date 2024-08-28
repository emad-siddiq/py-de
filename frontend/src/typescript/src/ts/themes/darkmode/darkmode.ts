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
            const htmlDiv = div as HTMLElement;
            htmlDiv.style.backgroundColor = "rgb(10, 15, 22)";
            htmlDiv.style.color = "#FCF5F5";
            
            // Only apply box shadow if the div originally has one
            if (window.getComputedStyle(htmlDiv).boxShadow !== 'none') {
                htmlDiv.style.boxShadow = "0px 3px 10px 3px rgba(20, 255, 60, 0.1)";
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

        // Update select elements
        let selects = document.querySelectorAll("select");
        selects.forEach(select => {
            const htmlSelect = select as HTMLSelectElement;
            htmlSelect.style.backgroundColor = "rgb(10, 15, 22)";
            htmlSelect.style.color = "#FCF5F5";
            htmlSelect.style.borderColor = "rgb(50, 50, 50)";
        });

        // Update button elements
        let buttons = document.querySelectorAll("button");
        buttons.forEach(button => {
            const htmlButton = button as HTMLButtonElement;
            htmlButton.style.backgroundColor = "rgb(50, 50, 50)";
            htmlButton.style.color = "#FCF5F5";
            htmlButton.style.borderColor = "rgb(70, 70, 70)";
        });

        // Update TextCell elements
        let textCells = document.querySelectorAll(".text-cell");
        textCells.forEach(textCell => {
            const htmlTextCell = textCell as HTMLElement;
            htmlTextCell.style.backgroundColor = "rgb(20, 20, 20)";
            htmlTextCell.style.color = "#FCF5F5";
            const textarea = htmlTextCell.querySelector('textarea') as HTMLTextAreaElement;
            if (textarea) {
                textarea.style.backgroundColor = "rgb(30, 30, 30)";
                textarea.style.color = "#FCF5F5";
                textarea.style.borderColor = "rgb(50, 50, 50)";
            }
        });
    }

    static disable() {
        document.body.style.backgroundColor = "white";
        document.body.style.color = "black";

        // Revert styles for all divs that originally have a box shadow
        let divs = document.querySelectorAll("div");

        divs.forEach(div => {
            const htmlDiv = div as HTMLElement;
            htmlDiv.style.backgroundColor = "white";
            htmlDiv.style.color = "black";
            
            // Only revert box shadow if the div originally has one
            if (window.getComputedStyle(htmlDiv).boxShadow !== 'none') {
                htmlDiv.style.boxShadow = "0px 10px 15px 5px rgba(20, 255, 60, 0.2)";
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

        // Revert styles for select elements
        let selects = document.querySelectorAll("select");
        selects.forEach(select => {
            const htmlSelect = select as HTMLSelectElement;
            htmlSelect.style.backgroundColor = "white";
            htmlSelect.style.color = "black";
            htmlSelect.style.borderColor = "rgb(200, 200, 200)";
        });

        // Revert styles for button elements
        let buttons = document.querySelectorAll("button");
        buttons.forEach(button => {
            const htmlButton = button as HTMLButtonElement;
            htmlButton.style.backgroundColor = "white";
            htmlButton.style.color = "black";
            htmlButton.style.borderColor = "rgb(200, 200, 200)";
        });

        // Revert TextCell elements
        let textCells = document.querySelectorAll(".text-cell");
        textCells.forEach(textCell => {
            const htmlTextCell = textCell as HTMLElement;
            htmlTextCell.style.backgroundColor = "white";
            htmlTextCell.style.color = "black";
            const textarea = htmlTextCell.querySelector('textarea') as HTMLTextAreaElement;
            if (textarea) {
                textarea.style.backgroundColor = "white";
                textarea.style.color = "black";
                textarea.style.borderColor = "rgb(200, 200, 200)";
            }
        });
    }
}

export { DarkMode };
