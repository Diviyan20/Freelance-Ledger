document.addEventListener('DOMContentLoaded', () => {
    // === DOM Element References ===
    const itemRows = document.getElementById('item-rows');
    const addItemBtn = document.getElementById('add-item');
    const totalEl = document.getElementById('total');
    const taxEl = document.getElementById('tax');
    const invoiceDateInput = document.getElementById('invoice-date');

    document.getElementById('tax-rate-input').addEventListener('input', calculateTotals);

    /**
     * Format a number as MYR currency.
     * @param {number} num 
     * @returns {string}
     */
    const formatCurrency = num =>
        new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
        }).format(num);

    // === Initialize random Invoice Number when page loads or refreshes ===
    document.getElementById('invoice-number').value =
        Math.floor(100000 + Math.random() * 900000);
    invoiceDateInput.valueAsDate = new Date();
    addRow();

    /**
     * Add a new line item row to the invoice table.
     * Calculates Total Amount based on the amount of services added.
     */
    function addRow() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" placeholder="Service description"></td>
        <td><input type="number" min="1" value="1" class="qty"></td>
        <td><input type="number" min="0" step="0.01" value="0.00" class="rate"></td>
        <td class="amount-cell">0.00</td>
        <td><button class="delete-btn">❌</button></td>
    `;
    itemRows.appendChild(row);
    updateEvents();
    calculateTotals();
}

    /**
     * Calculate and update subtotal, tax, and total amounts.
     */
    function calculateTotals() {
        let subtotal = 0;
        const rows = itemRows.querySelectorAll('tr');

        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.qty')?.value || 0);
            const rate = parseFloat(row.querySelector('.rate')?.value || 0);
            const amount = qty * rate;

            row.querySelector('.amount-cell').textContent = formatCurrency(amount);
            subtotal += amount;
        });

        const taxRateInput = document.getElementById('tax-rate-input');
        const taxRateDisplay = document.getElementById('tax-rate-display');
        const taxRate = parseFloat(taxRateInput?.value || 0) / 100;

        taxRateDisplay.textContent = taxRateInput?.value || 0; //Update Tax Display in Totals

        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        totalEl.textContent = formatCurrency(total);
        taxEl.textContent = formatCurrency(tax);
    }

    /**
     * Reassign input/change event handlers for all line items.
     */
    function updateEvents() {
        //Attach Input Listeners for recalculation
        itemRows.querySelectorAll('input').forEach(input =>
            input.addEventListener('input', calculateTotals)
        );


        //Function for deleting a row for Invoice Details
        itemRows.querySelectorAll('.delete-btn').forEach(btn =>
            btn.addEventListener('click', e => {
                const row = e.target.closest('tr');
                const totalRows = itemRows.querySelectorAll('tr').length;
                if (totalRows > 1) {
                    row.remove();
                    calculateTotals();
                } else {
                    alert("At least 1 row must be present!");
                }
            })
        );
    }

    /**
     * Update the invoice summary layout used for PDF generation.
     */
    function updateSummaryLayout() {
    const getInputValue = id => document.getElementById(id)?.value || '';

    //Invoice Creator's Information
    document.getElementById("summary-your-name").textContent = getInputValue("your-name");
    document.getElementById("summary-your-phone").textContent = getInputValue("your-phone");
    document.getElementById("summary-your-email").textContent = getInputValue("your-email");
    document.getElementById("summary-your-address-line1").textContent = getInputValue("your-address-line1");
    document.getElementById("summary-your-address-line2").textContent = getInputValue("your-address-line2");
    document.getElementById("summary-your-city").textContent = getInputValue("your-city");
    document.getElementById("summary-your-state").textContent = getInputValue("your-state");

    //Client's Information
    document.getElementById("summary-client-name").textContent = getInputValue("client-name");
    document.getElementById("summary-client-phone").textContent = getInputValue("client-phone");
    document.getElementById("summary-client-email").textContent = getInputValue("client-email");
    document.getElementById("summary-client-address-line1").textContent = getInputValue("client-address-line1");
    document.getElementById("summary-client-address-line2").textContent = getInputValue("client-address-line2");
    document.getElementById("summary-client-city").textContent = getInputValue("client-city");
    document.getElementById("summary-client-state").textContent = getInputValue("client-state");


    //Invoice Summary Info
    document.getElementById("summary-invoice-number").textContent = "Invoice #: " + getInputValue("invoice-number");

    const projectName = getInputValue("project-name");
    document.getElementById("summary-project-name").textContent = projectName ? `Project: ${projectName}` : "";

    const invoiceDate = getInputValue("invoice-date");
    document.getElementById("summary-invoice-date").textContent = invoiceDate ? `Date: ${invoiceDate}` : "";

    //Tax and Totals Info
    document.getElementById("summary-total").textContent = totalEl.textContent;
    document.getElementById("summary-tax").textContent = taxEl.textContent;

    const taxRateInput = document.getElementById('tax-rate-input');
    document.getElementById('summary-tax-rate').textContent = taxRateInput?.value || 0;

    //Additional Information Area
    const notesTextarea = document.querySelector('textarea');
    document.getElementById("summary-notes").textContent = notesTextarea?.value || '';

    // Line items
    const summaryBody = document.getElementById('summary-line-items');
    summaryBody.innerHTML = '';

    itemRows.querySelectorAll('tr').forEach(row => {
        const descInput = row.querySelector("td input[type='text']");
        const qtyInput = row.querySelector(".qty");
        const rateInput = row.querySelector(".rate");
        const amountCell = row.querySelector(".amount-cell");

        /**
     * Checks if the items in the row are valid or not.
     * Renders the items in the PDF if all are valid.
     */
        if (descInput && qtyInput && rateInput && amountCell) {
            const description = descInput.value.trim();
            const quantity = parseFloat(qtyInput.value || 0).toFixed(0);
            const rate = parseFloat(rateInput.value || 0).toFixed(2);
            const amount = amountCell.textContent || '0.00';

            if (!description && parseFloat(amount) === 0) return;

            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${description}</td><td>${quantity}</td><td>${rate}</td><td>${amount}</td>`;
            summaryBody.appendChild(tr);
        }
    });
}

    /**
     * Generate and download the invoice as a PDF.
     */
    async function generatePDF() {
        const loadingText = document.getElementById('loading-text');
        const loadingOverlay = document.getElementById('loading-overlay');
        const subheadingText = document.getElementById('subheading-text');
        const motivationalText = document.getElementById('motivation-text');
        const invoiceSummary = document.getElementById('invoice-summary');

        //Show an Overlay Text that says its generating the PDF
        loadingText.textContent = "Generating PDF....";
        requestAnimationFrame(() => loadingOverlay.classList.add('show'));

        //Update entire Invoice Layout with all form values
        updateSummaryLayout();
        const projectName = document.getElementById('project-name').value || 'Untitled';
        const invoiceDateValue = document.getElementById('invoice-date').value || new Date().toISOString().split('T')[0];
        invoiceSummary.style.display = 'block';

        const canvas = await html2canvas(invoiceSummary, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'pt', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = canvas.height * (pageWidth / canvas.width);
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }

        /**
     * Generate and download the invoice as a PDF.
     * projectName is the name of the Client's Project
     * invoiceDateValue is the Date the Invoice is created
     */
        pdf.save(`Invoice_${projectName}_${invoiceDateValue}.pdf`);

        /**
     * Confirmation message loads once the PDF is generated and the user can save it to their local device
     * A thank you message and a motivational text is also displayed to enhance user experience
     */
        loadingText.textContent = "PDF Generated!";
        loadingText.style.transform = "scale(1.1)";
        loadingText.style.color = "#90ee90";

        subheadingText.textContent = "Thank you for using our Invoice Generator.";
        motivationalText.textContent = "Keep building your dreams, one invoice at a time.";

        subheadingText.style.display = "block";
        motivationalText.style.display = "block";
        subheadingText.style.opacity = "0";
        motivationalText.style.opacity = "0";

        setTimeout(() => {
            subheadingText.style.transition = 'opacity 0.8s ease';
            motivationalText.style.transition = 'opacity 1.2s ease';
            subheadingText.style.opacity = "1";
            motivationalText.style.opacity = "1";
        }, 3000);

        setTimeout(() => {
            loadingOverlay.classList.remove('show');
            loadingText.style = "";
            subheadingText.style.display = "none";
            motivationalText.style.display = "none";
            invoiceSummary.style.display = 'none';
        }, 6000);
    }

    // === Event Listeners ===
    addItemBtn.addEventListener('click', addRow);
    document.getElementById('pdf-button').addEventListener('click', generatePDF);
});
    