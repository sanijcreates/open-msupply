use async_graphql::*;
use graphql_core::{
    simple_generic_errors::{CannotEditInvoice, RecordNotFound},
    standard_graphql_error::validate_auth,
    standard_graphql_error::StandardGraphqlError,
    ContextExt,
};
use graphql_types::types::InvoiceLineConnector;
use service::{
    auth::{Resource, ResourceAccessRequest},
    invoice::outbound_shipment::{
        AddFromMasterList as ServiceInput, AddToShipmentFromMasterListError as ServiceError,
    },
};

#[derive(InputObject)]
pub struct AddToShipmentFromMasterListInput {
    pub outbound_shipment_id: String,
    pub master_list_id: String,
}

pub struct MasterListNotFoundForThisName;
#[Object]
impl MasterListNotFoundForThisName {
    pub async fn description(&self) -> &'static str {
        "Master list not found (might not be visible to this name)"
    }
}

#[derive(Interface)]
#[graphql(name = "AddToShipmentFromMasterListErrorInterface")]
#[graphql(field(name = "description", type = "String"))]
pub enum DeleteErrorInterface {
    RecordNotFound(RecordNotFound),
    MasterListNotFoundForThisName(MasterListNotFoundForThisName),
    CannotEditInvoice(CannotEditInvoice),
}

#[derive(SimpleObject)]
#[graphql(name = "AddToShipmentFromMasterListError")]
pub struct DeleteError {
    pub error: DeleteErrorInterface,
}

#[derive(Union)]
#[graphql(name = "AddToShipmentFromMasterListResponse")]
pub enum AddFromMasterListResponse {
    Error(DeleteError),
    Response(InvoiceLineConnector),
}

pub fn add_from_master_list(
    ctx: &Context<'_>,
    store_id: &str,
    input: AddToShipmentFromMasterListInput,
) -> Result<AddFromMasterListResponse> {
    validate_auth(
        ctx,
        &ResourceAccessRequest {
            resource: Resource::MutateOutboundShipment,
            store_id: Some(store_id.to_string()),
        },
    )?;

    let service_provider = ctx.service_provider();
    let service_context = service_provider.context()?;

    let response = match service_provider.invoice_service.add_from_master_list(
        &service_context,
        store_id,
        input.to_domain(),
    ) {
        Ok(invoice_lines) => {
            AddFromMasterListResponse::Response(InvoiceLineConnector::from_vec(invoice_lines))
        }
        Err(error) => AddFromMasterListResponse::Error(DeleteError {
            error: map_error(error)?,
        }),
    };

    Ok(response)
}

impl AddToShipmentFromMasterListInput {
    pub fn to_domain(self) -> ServiceInput {
        let AddToShipmentFromMasterListInput {
            outbound_shipment_id,
            master_list_id,
        } = self;
        ServiceInput {
            outbound_shipment_id,
            master_list_id,
        }
    }
}

fn map_error(error: ServiceError) -> Result<DeleteErrorInterface> {
    use StandardGraphqlError::*;
    let formatted_error = format!("{:#?}", error);

    let graphql_error = match error {
        // Structured Errors
        ServiceError::ShipmentDoesNotExist => {
            return Ok(DeleteErrorInterface::RecordNotFound(RecordNotFound {}))
        }
        ServiceError::CannotEditShipment => {
            return Ok(DeleteErrorInterface::CannotEditInvoice(
                CannotEditInvoice {},
            ))
        }
        ServiceError::MasterListNotFoundForThisName => {
            return Ok(DeleteErrorInterface::MasterListNotFoundForThisName(
                MasterListNotFoundForThisName {},
            ))
        }
        // Standard Graphql Errors
        ServiceError::NotThisStoreShipment => BadUserInput(formatted_error),
        ServiceError::NotAnOutboundShipment => BadUserInput(formatted_error),
        ServiceError::DatabaseError(_) => InternalError(formatted_error),
    };

    Err(graphql_error.extend())
}

#[cfg(test)]
mod test {
    use async_graphql::EmptyMutation;
    use graphql_core::{
        assert_graphql_query, assert_standard_graphql_error, test_helpers::setup_graphl_test,
    };
    use repository::{
        mock::{
            mock_new_outbound_shipment_no_lines, mock_outbound_shipment_line_a, MockDataInserts,
        },
        InvoiceLine, StorageConnectionManager,
    };
    use serde_json::json;
    use service::{
        invoice::{
            outbound_shipment::{
                AddFromMasterList as ServiceInput, AddToShipmentFromMasterListError as ServiceError,
            },
            InvoiceServiceTrait,
        },
        service_provider::{ServiceContext, ServiceProvider},
    };

    use crate::InvoiceMutations;

    type DeleteLineMethod =
        dyn Fn(&str, ServiceInput) -> Result<Vec<InvoiceLine>, ServiceError> + Sync + Send;

    pub struct TestService(pub Box<DeleteLineMethod>);

    impl InvoiceServiceTrait for TestService {
        fn add_from_master_list(
            &self,
            _: &ServiceContext,
            store_id: &str,
            input: ServiceInput,
        ) -> Result<Vec<InvoiceLine>, ServiceError> {
            self.0(store_id, input)
        }
    }

    fn service_provider(
        test_service: TestService,
        connection_manager: &StorageConnectionManager,
    ) -> ServiceProvider {
        let mut service_provider = ServiceProvider::new(connection_manager.clone(), "app_data");
        service_provider.invoice_service = Box::new(test_service);
        service_provider
    }

    fn empty_variables() -> serde_json::Value {
        json!({
          "input": {
            "outboundShipmentId": "n/a",
            "masterListId": "n/a",
          },
          "storeId": "n/a"
        })
    }

    #[actix_rt::test]
    async fn test_graphql_add_from_master_list_errors() {
        let (_, _, connection_manager, settings) = setup_graphl_test(
            EmptyMutation,
            InvoiceMutations,
            "test_graphql_add_from_master_list_structured_errors",
            MockDataInserts::all(),
        )
        .await;

        let mutation = r#"
        mutation ($input: AddToShipmentFromMasterListInput!, $storeId: String) {
            addToShipmentFromMasterList(storeId: $storeId, input: $input) {
              ... on AddToShipmentFromMasterListError {
                error {
                  __typename
                }
              }
            }
          }
        "#;

        // InvoiceDoesNotExist
        let test_service = TestService(Box::new(|_, _| Err(ServiceError::ShipmentDoesNotExist)));

        let expected = json!({
            "addToShipmentFromMasterList": {
              "error": {
                "__typename": "RecordNotFound"
              }
            }
          }
        );

        assert_graphql_query!(
            &settings,
            mutation,
            &Some(empty_variables()),
            &expected,
            Some(service_provider(test_service, &connection_manager))
        );

        // CannotEditInvoice
        let test_service = TestService(Box::new(|_, _| Err(ServiceError::CannotEditShipment)));

        let expected = json!({
            "addToShipmentFromMasterList": {
              "error": {
                "__typename": "CannotEditInvoice"
              }
            }
          }
        );

        assert_graphql_query!(
            &settings,
            mutation,
            &Some(empty_variables()),
            &expected,
            Some(service_provider(test_service, &connection_manager))
        );

        // MasterListNotFoundForThisName
        let test_service = TestService(Box::new(|_, _| {
            Err(ServiceError::MasterListNotFoundForThisName)
        }));

        let expected = json!({
            "addToShipmentFromMasterList": {
              "error": {
                "__typename": "MasterListNotFoundForThisName"
              }
            }
          }
        );

        assert_graphql_query!(
            &settings,
            mutation,
            &Some(empty_variables()),
            &expected,
            Some(service_provider(test_service, &connection_manager))
        );

        // NotThisStoreInvoice
        let test_service = TestService(Box::new(|_, _| Err(ServiceError::NotThisStoreShipment)));
        let expected_message = "Bad user input";
        assert_standard_graphql_error!(
            &settings,
            &mutation,
            &Some(empty_variables()),
            &expected_message,
            None,
            Some(service_provider(test_service, &connection_manager))
        );

        // NotAnOutboundShipment
        let test_service = TestService(Box::new(|_, _| Err(ServiceError::NotAnOutboundShipment)));
        let expected_message = "Bad user input";
        assert_standard_graphql_error!(
            &settings,
            &mutation,
            &Some(empty_variables()),
            &expected_message,
            None,
            Some(service_provider(test_service, &connection_manager))
        );
    }

    #[actix_rt::test]
    async fn test_graphql_add_from_master_list_success() {
        let (_, _, connection_manager, settings) = setup_graphl_test(
            EmptyMutation,
            InvoiceMutations,
            "test_graphql_add_from_master_list_success",
            MockDataInserts::all(),
        )
        .await;

        let mutation = r#"
        mutation ($storeId: String, $input: AddToShipmentFromMasterListInput!) {
            addToShipmentFromMasterList(storeId: $storeId, input: $input) {
                ... on InvoiceLineConnector{
                  nodes {
                    id
                  }
                }
            }
          }
        "#;

        // Success
        let test_service = TestService(Box::new(|store_id, input| {
            assert_eq!(store_id, "store_a");
            assert_eq!(
                input,
                ServiceInput {
                    outbound_shipment_id: "id input".to_string(),
                    master_list_id: "master list id input".to_string(),
                }
            );
            Ok(vec![InvoiceLine {
                invoice_line_row: mock_outbound_shipment_line_a(),
                invoice_row: mock_new_outbound_shipment_no_lines(),
                location_row_option: None,
                stock_line_option: None,
            }])
        }));

        let variables = json!({
          "input": {
            "outboundShipmentId": "id input",
            "masterListId": "master list id input"
          },
          "storeId": "store_a"
        });

        let expected = json!({
            "addToShipmentFromMasterList": {
              "nodes": [
                {
                  "id": mock_outbound_shipment_line_a().id
                }
              ]
            }
          }
        );

        assert_graphql_query!(
            &settings,
            mutation,
            &Some(variables),
            &expected,
            Some(service_provider(test_service, &connection_manager))
        );
    }
}