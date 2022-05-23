use async_graphql::*;
use chrono::NaiveDate;

use graphql_core::simple_generic_errors::CannotEditStocktake;
use graphql_core::standard_graphql_error::{validate_auth, StandardGraphqlError};
use graphql_core::ContextExt;
use graphql_types::types::StocktakeLineNode;
use repository::StocktakeLine;
use service::{
    auth::{Resource, ResourceAccessRequest},
    stocktake_line::{
        InsertStocktakeLine as ServiceInput, InsertStocktakeLineError as ServiceError,
    },
};

#[derive(InputObject)]
#[graphql(name = "InsertStocktakeLineInput")]
pub struct InsertInput {
    pub id: String,
    pub stocktake_id: String,
    pub stock_line_id: Option<String>,
    pub location_id: Option<String>,
    pub comment: Option<String>,
    pub counted_number_of_packs: Option<u32>,
    pub item_id: Option<String>,
    pub batch: Option<String>,
    pub expiry_date: Option<NaiveDate>,
    pub pack_size: Option<u32>,
    pub cost_price_per_pack: Option<f64>,
    pub sell_price_per_pack: Option<f64>,
    pub note: Option<String>,
}

#[derive(Union)]
#[graphql(name = "InsertStocktakeLineResponse")]
pub enum InsertResponse {
    Error(InsertError),
    Response(StocktakeLineNode),
}

#[derive(Interface)]
#[graphql(name = "InsertStocktakeLineErrorInterface")]
#[graphql(field(name = "description", type = "String"))]
pub enum InsertErrorInterface {
    CannotEditStocktake(CannotEditStocktake),
}

#[derive(SimpleObject)]
#[graphql(name = "InsertStocktakeLineError")]
pub struct InsertError {
    pub error: InsertErrorInterface,
}

pub fn insert(ctx: &Context<'_>, store_id: &str, input: InsertInput) -> Result<InsertResponse> {
    validate_auth(
        ctx,
        &ResourceAccessRequest {
            resource: Resource::MutateStocktake,
            store_id: Some(store_id.to_string()),
        },
    )?;

    let service_provider = ctx.service_provider();
    let service_context = service_provider.context()?;
    map_response(
        service_provider
            .stocktake_line_service
            .insert_stocktake_line(&service_context, store_id, input.to_domain()),
    )
}

pub fn map_response(from: Result<StocktakeLine, ServiceError>) -> Result<InsertResponse> {
    let result = match from {
        Ok(line) => InsertResponse::Response(StocktakeLineNode::from_domain(line)),
        Err(error) => InsertResponse::Error(InsertError {
            error: map_error(error)?,
        }),
    };

    Ok(result)
}

fn map_error(error: ServiceError) -> Result<InsertErrorInterface> {
    use StandardGraphqlError::*;
    let formatted_error = format!("{:#?}", error);

    let graphql_error = match error {
        // Structured Errors
        ServiceError::CannotEditFinalised => {
            return Ok(InsertErrorInterface::CannotEditStocktake(
                CannotEditStocktake {},
            ))
        }
        // Standard Graphql Errors
        // TODO some are structured errors (where can be changed concurrently)
        ServiceError::InvalidStore => BadUserInput(formatted_error),
        ServiceError::StocktakeDoesNotExist => BadUserInput(formatted_error),
        ServiceError::StocktakeLineAlreadyExists => BadUserInput(formatted_error),
        ServiceError::StockLineDoesNotExist => BadUserInput(formatted_error),
        ServiceError::StockLineAlreadyExistsInStocktake => BadUserInput(formatted_error),
        ServiceError::LocationDoesNotExist => BadUserInput(formatted_error),
        ServiceError::StocktakeIsLocked => BadUserInput(formatted_error),
        ServiceError::StockLineXOrItem => BadUserInput(format!(
            "Either a stock line id or item id must be set (not both), {}",
            formatted_error
        )),
        ServiceError::ItemDoesNotExist => BadUserInput(formatted_error),
        ServiceError::DatabaseError(_) => InternalError(formatted_error),
        ServiceError::InternalError(err) => InternalError(err),
    };

    Err(graphql_error.extend())
}

impl InsertInput {
    pub fn to_domain(self) -> ServiceInput {
        let InsertInput {
            id,
            stocktake_id,
            stock_line_id,
            location_id,
            comment,
            counted_number_of_packs,
            item_id,
            batch,
            expiry_date,
            pack_size,
            cost_price_per_pack,
            sell_price_per_pack,
            note,
        } = self;

        ServiceInput {
            id,
            stocktake_id,
            stock_line_id,
            location_id,
            comment,
            counted_number_of_packs,
            item_id,
            batch,
            expiry_date,
            pack_size,
            cost_price_per_pack,
            sell_price_per_pack,
            note,
        }
    }
}

#[cfg(test)]
mod test {
    use async_graphql::EmptyMutation;
    use chrono::NaiveDate;
    use graphql_core::{
        assert_graphql_query, assert_standard_graphql_error, test_helpers::setup_graphl_test,
    };
    use repository::{
        mock::{mock_location_1, mock_stock_line_a, MockDataInserts},
        StocktakeLine, StocktakeLineRow, StorageConnectionManager,
    };
    use serde_json::json;
    use service::{
        service_provider::{ServiceContext, ServiceProvider},
        stocktake_line::*,
    };

    use crate::StocktakeLineMutations;

    type ServiceMethod = dyn Fn(
            &ServiceContext,
            &str,
            InsertStocktakeLine,
        ) -> Result<StocktakeLine, InsertStocktakeLineError>
        + Sync
        + Send;

    pub struct TestService(pub Box<ServiceMethod>);

    impl StocktakeLineServiceTrait for TestService {
        fn insert_stocktake_line(
            &self,
            ctx: &ServiceContext,
            store_id: &str,
            input: InsertStocktakeLine,
        ) -> Result<StocktakeLine, InsertStocktakeLineError> {
            (self.0)(ctx, store_id, input)
        }
    }

    pub fn service_provider(
        test_service: TestService,
        connection_manager: &StorageConnectionManager,
    ) -> ServiceProvider {
        let mut service_provider = ServiceProvider::new(connection_manager.clone());
        service_provider.stocktake_line_service = Box::new(test_service);
        service_provider
    }

    #[actix_rt::test]
    async fn test_graphql_stocktake_line_insert() {
        let (_, _, connection_manager, settings) = setup_graphl_test(
            EmptyMutation,
            StocktakeLineMutations,
            "omsupply-database-gql-stocktake_line_insert",
            MockDataInserts::all(),
        )
        .await;

        let query = r#"mutation InsertStocktakeLine($storeId: String, $input: InsertStocktakeLineInput!) {
            insertStocktakeLine(storeId: $storeId, input: $input) {
                ... on StocktakeLineNode {                    
                        id
                }
            }
        }"#;

        let variables = Some(json!({
            "storeId": "store id",
            "input": {
                "id": "id1",
                "stocktakeId": "stocktake id",
                "stockLineId": "stock line id",
                "locationId": "location id",
                "countedNumberOfPacks": 20,
                "comment": "comment",
                "itemId": "item id",
                "batch": "batch",
                "expiryDate": "2023-01-22",
                "packSize": 10,
                "costPricePerPack": 10.0,
                "sellPricePerPack": 12.0,
                "note": "note"
            }
        }));

        // Stocktake is locked mapping
        let test_service = TestService(Box::new(|_, _, _| {
            Err(InsertStocktakeLineError::StocktakeIsLocked)
        }));

        let expected_message = "Bad user input";
        assert_standard_graphql_error!(
            &settings,
            &query,
            &variables,
            &expected_message,
            None,
            Some(service_provider(test_service, &connection_manager))
        );

        // success
        let test_service = TestService(Box::new(|_, _, _| {
            Ok(StocktakeLine {
                line: StocktakeLineRow {
                    id: "id1".to_string(),
                    stocktake_id: "stocktake id".to_string(),
                    stock_line_id: Some("stock line id".to_string()),
                    location_id: Some("location id".to_string()),
                    snapshot_number_of_packs: 10,
                    counted_number_of_packs: Some(20),
                    comment: Some("comment".to_string()),
                    item_id: "item id".to_string(),
                    batch: Some("batch".to_string()),
                    expiry_date: Some(NaiveDate::from_ymd(2023, 1, 22)),
                    pack_size: Some(10),
                    cost_price_per_pack: Some(10.0),
                    sell_price_per_pack: Some(12.0),
                    note: Some("note".to_string()),
                },
                stock_line: Some(mock_stock_line_a()),
                location: Some(mock_location_1()),
            })
        }));

        let expected = json!({
            "insertStocktakeLine": {
              "id": "id1",
            }
          }
        );
        assert_graphql_query!(
            &settings,
            query,
            &variables,
            &expected,
            Some(service_provider(test_service, &connection_manager))
        );
    }
}