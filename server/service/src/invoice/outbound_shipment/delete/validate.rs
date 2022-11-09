use super::DeleteOutboundShipmentError;
use crate::invoice::{
    check_invoice_exists_option, check_invoice_is_editable, check_invoice_type, check_store,
    InvoiceLinesExist,
};
use repository::{InvoiceRow, InvoiceRowType, StorageConnection};

pub fn validate(
    id: &str,
    store_id: &str,
    connection: &StorageConnection,
) -> Result<InvoiceRow, DeleteOutboundShipmentError> {
    use DeleteOutboundShipmentError::*;

    let invoice = check_invoice_exists_option(&id, connection)?.ok_or(InvoiceDoesNotExist)?;
    if !check_store(&invoice, store_id) {
        return Err(NotThisStoreInvoice);
    }
    if !check_invoice_is_editable(&invoice) {
        return Err(CannotEditFinalised);
    }
    if !check_invoice_type(&invoice, InvoiceRowType::OutboundShipment) {
        return Err(NotAnOutboundShipment);
    }

    // check_invoice_is_empty(&id, connection)?; https://github.com/openmsupply/remote-server/issues/839

    Ok(invoice)
}

impl From<InvoiceLinesExist> for DeleteOutboundShipmentError {
    fn from(error: InvoiceLinesExist) -> Self {
        DeleteOutboundShipmentError::InvoiceLinesExists(error.0)
    }
}
