use crate::{
    invoice::{
        check_invoice_exists_option, check_invoice_is_editable, check_invoice_type, check_store,
    },
    invoice_line::{
        check_batch_exists, check_batch_on_hold, check_item_matches_batch, check_location_on_hold,
        check_unique_stock_line,
        validate::{
            check_item, check_line_does_not_exists, check_number_of_packs, ItemNotFound,
            LineAlreadyExists, NumberOfPacksBelowOne,
        },
        BatchIsOnHold, ItemDoesNotMatchStockLine, LocationIsOnHoldError,
        StockLineAlreadyExistsInInvoice, StockLineNotFound,
    },
};
use repository::{InvoiceRow, InvoiceRowType, ItemRow, StockLineRow, StorageConnection};

use super::{InsertOutboundShipmentLine, InsertOutboundShipmentLineError};

pub fn validate(
    input: &InsertOutboundShipmentLine,
    store_id: &str,
    connection: &StorageConnection,
) -> Result<(ItemRow, InvoiceRow, StockLineRow), InsertOutboundShipmentLineError> {
    use InsertOutboundShipmentLineError::*;

    check_line_does_not_exists(&input.id, connection)?;
    check_number_of_packs(Some(input.number_of_packs))?;
    let batch = check_batch_exists(&input.stock_line_id, connection)?;
    let item = check_item(&input.item_id, connection)?;
    check_item_matches_batch(&batch, &item)?;
    let invoice =
        check_invoice_exists_option(&input.invoice_id, connection)?.ok_or(InvoiceDoesNotExist)?;
    if !check_store(&invoice, store_id) {
        return Err(NotThisStoreInvoice);
    }
    check_unique_stock_line(
        &input.id,
        &invoice.id,
        Some(input.stock_line_id.to_string()),
        connection,
    )?;
    if !check_invoice_type(&invoice, InvoiceRowType::OutboundShipment) {
        return Err(NotAnOutboundShipment);
    }
    if !check_invoice_is_editable(&invoice) {
        return Err(CannotEditFinalised);
    }

    check_batch_on_hold(&batch)?;
    check_location_on_hold(&batch, connection)?;
    check_reduction_below_zero(&input, &batch)?;

    Ok((item, invoice, batch))
}

fn check_reduction_below_zero(
    input: &InsertOutboundShipmentLine,
    batch: &StockLineRow,
) -> Result<(), InsertOutboundShipmentLineError> {
    if batch.available_number_of_packs < input.number_of_packs {
        Err(InsertOutboundShipmentLineError::ReductionBelowZero {
            stock_line_id: batch.id.clone(),
        })
    } else {
        Ok(())
    }
}

impl From<BatchIsOnHold> for InsertOutboundShipmentLineError {
    fn from(_: BatchIsOnHold) -> Self {
        InsertOutboundShipmentLineError::BatchIsOnHold
    }
}

impl From<LocationIsOnHoldError> for InsertOutboundShipmentLineError {
    fn from(error: LocationIsOnHoldError) -> Self {
        use InsertOutboundShipmentLineError::*;
        match error {
            LocationIsOnHoldError::LocationIsOnHold => LocationIsOnHold,
            LocationIsOnHoldError::LocationNotFound => LocationNotFound,
        }
    }
}

impl From<StockLineAlreadyExistsInInvoice> for InsertOutboundShipmentLineError {
    fn from(error: StockLineAlreadyExistsInInvoice) -> Self {
        InsertOutboundShipmentLineError::StockLineAlreadyExistsInInvoice(error.0)
    }
}

impl From<ItemDoesNotMatchStockLine> for InsertOutboundShipmentLineError {
    fn from(_: ItemDoesNotMatchStockLine) -> Self {
        InsertOutboundShipmentLineError::ItemDoesNotMatchStockLine
    }
}

impl From<ItemNotFound> for InsertOutboundShipmentLineError {
    fn from(_: ItemNotFound) -> Self {
        InsertOutboundShipmentLineError::ItemNotFound
    }
}

impl From<StockLineNotFound> for InsertOutboundShipmentLineError {
    fn from(_: StockLineNotFound) -> Self {
        InsertOutboundShipmentLineError::StockLineNotFound
    }
}

impl From<NumberOfPacksBelowOne> for InsertOutboundShipmentLineError {
    fn from(_: NumberOfPacksBelowOne) -> Self {
        InsertOutboundShipmentLineError::NumberOfPacksBelowOne
    }
}

impl From<LineAlreadyExists> for InsertOutboundShipmentLineError {
    fn from(_: LineAlreadyExists) -> Self {
        InsertOutboundShipmentLineError::LineAlreadyExists
    }
}
