namespace QubiqonFinanceHub.API.Models.Constants

{
    public class Constants
    {
        public static class EmailTemplateKeys
        {
            public const string ExpenseSubmitted = "expense_submitted";
            public const string ExpenseApproved = "expense_approved";
            public const string ExpenseRejected = "expense_rejected";
            /// <summary>Notify expense submitter to upload bills after approval without documents.</summary>
            public const string ExpenseSubmitterUploadBills = "expense_submitter_upload_bills";
            /// <summary>Notify finance when bill documents are uploaded and expense is awaiting payment.</summary>
            public const string ExpenseBillUploadedFinance = "expense_bill_uploaded_finance";
            public const string PaymentConfirmation = "payment_confirmation";
            public const string AdvanceSubmitted = "advance_submitted";
            public const string AdvanceApproved = "advance_approved";
            public const string AdvanceRejected = "advance_rejected";
            public const string AdvanceDisbursed = "advance_disbursed";
            public const string VendorBillSubmitted = "vendor_bill_submitted";
            public const string VendorBillApproved = "vendor_bill_approved";
            public const string VendorBillRejected = "vendor_bill_rejected";
            public const string VendorBillPaid = "vendor_bill_paid";
            public const string InvoiceCreated = "invoice_created";
            public const string InvoiceSent = "invoice_sent";
            public const string InvoicePaid = "invoice_paid";
            public const string WelcomeUser = "welcome_user";
        }

        /// <summary>Keys stored in OrganizationSettings (see Admin → Settings).</summary>
        public static class OrganizationSettingKeys
        {
            /// <summary>Base URL of the web app for email deep links (no trailing slash), e.g. https://finance.example.com</summary>
            public const string FrontendUrl = "frontendUrl";
        }
    }
}
