use crate::{
    database::repository::{
        InvoiceRepository, RepositoryError, StorageConnectionManager, TransactionError,
    },
    domain::invoice_line::InvoiceLine,
};

pub mod validate;

use validate::validate;

pub fn delete_customer_invoice(
    connection_manager: &StorageConnectionManager,
    id: String,
) -> Result<String, DeleteCustomerInvoiceError> {
    let connection = connection_manager.connection()?;

    connection
        .transaction_sync(|connection| {
            validate(&id, &connection)?;
            InvoiceRepository::new(&connection).delete(&id)?;

            Ok(())
        })
        .map_err(
            |error: TransactionError<DeleteCustomerInvoiceError>| match error {
                TransactionError::Transaction { msg } => RepositoryError::DBError { msg }.into(),
                TransactionError::Inner(error) => error,
            },
        )?;

    Ok(id)
}

pub enum DeleteCustomerInvoiceError {
    InvoiceDoesNotExist,
    DatabaseError(RepositoryError),
    NotThisStoreInvoice,
    CannotEditFinalised,
    InvoiceLinesExists(Vec<InvoiceLine>),
    NotACustomerInvoice,
}

impl From<RepositoryError> for DeleteCustomerInvoiceError {
    fn from(error: RepositoryError) -> Self {
        DeleteCustomerInvoiceError::DatabaseError(error)
    }
}
