use repository::{
    MasterListRow, NameTagRowRepository, PeriodScheduleRowRepository,
    ProgramRequisitionSettingsRow, ProgramRow, StorageConnection, SyncBufferRow,
};

use serde::Deserialize;

use super::{
    IntegrationRecords, LegacyTableName, PullDeleteRecordTable, PullUpsertRecord, SyncTranslation,
};

#[allow(non_snake_case)]
#[derive(Deserialize)]
pub struct LegacyListMasterRow {
    #[serde(rename = "ID")]
    id: String,
    description: String,
    #[serde(rename = "isProgram")]
    is_program: bool,
    code: String,
    note: String,
    #[serde(rename = "programSettings")]
    program_settings: Option<LegacyProgramSettings>,
}

#[derive(Deserialize)]
struct LegacyProgramSettings {
    #[serde(rename = "storeTags")]
    store_tags: LegacyStoreTagAndProgramName,
}

#[derive(Deserialize)]
struct LegacyStoreTagAndProgramName {
    #[serde(flatten)]
    tags: std::collections::HashMap<String, LegacyStoreTag>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyStoreTag {
    order_types: Vec<LegacyOrderType>,
    period_schedule_name: String,
}

#[derive(Deserialize)]
struct LegacyOrderType {
    name: String,
    #[serde(rename = "thresholdMOS")]
    threshold_mos: i32,
    #[serde(rename = "maxMOS")]
    max_mos: i32,
    #[serde(rename = "maxOrdersPerPeriod")]
    max_order_per_period: i32,
}

fn match_pull_table(sync_record: &SyncBufferRow) -> bool {
    sync_record.table_name == LegacyTableName::LIST_MASTER
}
pub(crate) struct MasterListTranslation {}
impl SyncTranslation for MasterListTranslation {
    fn try_translate_pull_upsert(
        &self,
        connection: &StorageConnection,
        sync_record: &SyncBufferRow,
    ) -> Result<Option<IntegrationRecords>, anyhow::Error> {
        if !match_pull_table(sync_record) {
            return Ok(None);
        }

        let data = serde_json::from_str::<LegacyListMasterRow>(&sync_record.data)?;

        let master_list = MasterListRow {
            id: data.id.clone(),
            name: data.description.clone(),
            code: data.code.clone(),
            description: data.note.clone(),
        };

        let (program, program_requisition_settings) = if data.is_program == true {
            let program_settings = data.program_settings.ok_or(anyhow::anyhow!(
                "Program settings not found for program {}",
                data.id
            ))?;
            let name_tag_and_period_schedule_ids = get_name_tag_and_period_schedule_id(
                connection,
                &program_settings.store_tags,
                &data.id.clone(),
            )?;

            let program = ProgramRow {
                id: data.id.clone(),
                name: data.description.clone(),
            };

            let program_requisition_settings = ProgramRequisitionSettingsRow {
                // Concatenate the program id and name tag id to create a unique id
                // instead of using uuid since easier to test this way.
                id: format!("{}{}", data.id, name_tag_and_period_schedule_ids.0),
                name_tag_id: name_tag_and_period_schedule_ids.0,
                program_id: data.id.clone(),
                period_schedule_id: name_tag_and_period_schedule_ids.1,
            };

            (program, program_requisition_settings)
        } else {
            return Ok(Some(IntegrationRecords::from_upsert(
                PullUpsertRecord::MasterList(master_list),
            )));
        };

        Ok(Some(IntegrationRecords::from_upserts(vec![
            PullUpsertRecord::MasterList(master_list),
            PullUpsertRecord::Program(program),
            PullUpsertRecord::ProgramRequisitionSettings(program_requisition_settings),
        ])))
    }

    fn try_translate_pull_delete(
        &self,
        _: &StorageConnection,
        sync_record: &SyncBufferRow,
    ) -> Result<Option<IntegrationRecords>, anyhow::Error> {
        let result = match_pull_table(sync_record).then(|| {
            IntegrationRecords::from_delete(
                &sync_record.record_id,
                PullDeleteRecordTable::MasterList,
            )
        });

        Ok(result)
    }
}

fn get_name_tag_and_period_schedule_id(
    connection: &StorageConnection,
    store_tag: &LegacyStoreTagAndProgramName,
    id: &String,
) -> Result<(String, String), anyhow::Error> {
    let name_tag = NameTagRowRepository::new(connection)
        .find_one_by_name(store_tag.tags.keys().next().unwrap())?
        .ok_or(anyhow::anyhow!("Name tag not found for program {}", id))?;

    let period_schedule = PeriodScheduleRowRepository::new(connection)
        .find_one_by_name(&store_tag.tags.values().next().unwrap().period_schedule_name)?
        .ok_or(anyhow::anyhow!(
            "Period schedule not found for program {}",
            id
        ))?;

    Ok((name_tag.id, period_schedule.id))
}

#[cfg(test)]
mod tests {
    use super::*;
    use repository::{mock::MockDataInserts, test_db::setup_all};

    #[actix_rt::test]
    async fn test_master_list_translation() {
        use crate::sync::test::test_data::master_list as test_data;
        let translator = MasterListTranslation {};

        let (_, connection, _, _) = setup_all(
            "test_master_list_translation",
            MockDataInserts::none().name_tags().period_schedules(),
        )
        .await;

        for record in test_data::test_pull_upsert_records() {
            let translation_result = translator
                .try_translate_pull_upsert(&connection, &record.sync_buffer_row)
                .unwrap();

            assert_eq!(translation_result, record.translated_record);
        }

        for record in test_data::test_pull_delete_records() {
            let translation_result = translator
                .try_translate_pull_delete(&connection, &record.sync_buffer_row)
                .unwrap();

            assert_eq!(translation_result, record.translated_record);
        }
    }
}
