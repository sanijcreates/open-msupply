use crate::{
    invoice::{
        check_invoice_exists_option, check_invoice_is_editable, check_invoice_type, check_store,
    },
    invoice_line::{
        inbound_shipment_line::check_batch,
        validate::{check_line_exists_option, NotInvoiceLine},
        BatchIsReserved,
    },
};
use repository::{InvoiceLineRow, InvoiceRow, InvoiceRowType, StorageConnection};

use super::{DeleteInboundShipmentLine, DeleteInboundShipmentLineError};

pub fn validate(
    input: &DeleteInboundShipmentLine,
    store_id: &str,
    connection: &StorageConnection,
) -> Result<(InvoiceRow, InvoiceLineRow), DeleteInboundShipmentLineError> {
    use DeleteInboundShipmentLineError::*;

    let line = check_line_exists_option(connection, &input.id)?.ok_or(LineDoesNotExist)?;
    let invoice =
        check_invoice_exists_option(&line.invoice_id, connection)?.ok_or(InvoiceDoesNotExist)?;

    if !check_store(&invoice, store_id) {
        return Err(NotThisStoreInvoice);
    }
    if !check_invoice_type(&invoice, InvoiceRowType::InboundShipment) {
        return Err(NotAnInboundShipment);
    }
    if !check_invoice_is_editable(&invoice) {
        return Err(CannotEditFinalised);
    }
    if !check_batch(&line, connection)? {
        return Err(BatchIsReserved);
    }

    Ok((invoice, line))
}

impl From<NotInvoiceLine> for DeleteInboundShipmentLineError {
    fn from(error: NotInvoiceLine) -> Self {
        DeleteInboundShipmentLineError::NotThisInvoiceLine(error.0)
    }
}

impl From<BatchIsReserved> for DeleteInboundShipmentLineError {
    fn from(_: BatchIsReserved) -> Self {
        DeleteInboundShipmentLineError::BatchIsReserved
    }
}
