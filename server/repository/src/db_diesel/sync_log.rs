use super::{
    sync_log_row::{sync_log, sync_log::dsl as sync_log_dsl},
    StorageConnection,
};

use crate::{
    diesel_macros::{apply_date_time_filter, apply_equal_filter, apply_sort},
    DBType, DatetimeFilter, EqualFilter, Pagination, RepositoryError, Sort, SyncLogRow,
};

use diesel::prelude::*;

#[derive(Debug, PartialEq, Clone)]
pub struct SyncLog {
    pub sync_log_row: SyncLogRow,
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct SyncLogFilter {
    pub id: Option<EqualFilter<String>>,
    pub prepare_initial_done_datetime: Option<DatetimeFilter>,
}

#[derive(PartialEq, Debug)]
pub enum SyncLogSortField {
    StartedDatetime,
    DoneDatetime,
}

pub type SyncLogSort = Sort<SyncLogSortField>;

pub struct SyncLogRepository<'a> {
    connection: &'a StorageConnection,
}

impl<'a> SyncLogRepository<'a> {
    pub fn new(connection: &'a StorageConnection) -> Self {
        SyncLogRepository { connection }
    }

    pub fn count(&self, filter: Option<SyncLogFilter>) -> Result<i64, RepositoryError> {
        let query = create_filtered_query(filter);
        Ok(query.count().get_result(&self.connection.connection)?)
    }

    pub fn query_one(&self, filter: SyncLogFilter) -> Result<Option<SyncLog>, RepositoryError> {
        Ok(self.query(Pagination::one(), Some(filter), None)?.pop())
    }

    pub fn query_by_filter(&self, filter: SyncLogFilter) -> Result<Vec<SyncLog>, RepositoryError> {
        self.query(Pagination::new(), Some(filter), None)
    }

    pub fn query(
        &self,
        pagination: Pagination,
        filter: Option<SyncLogFilter>,
        sort: Option<SyncLogSort>,
    ) -> Result<Vec<SyncLog>, RepositoryError> {
        let mut query = create_filtered_query(filter);
        if let Some(sort) = sort {
            match sort.key {
                SyncLogSortField::StartedDatetime => {
                    apply_sort!(query, sort, sync_log_dsl::started_datetime)
                }
                SyncLogSortField::DoneDatetime => {
                    apply_sort!(query, sort, sync_log_dsl::done_datetime)
                }
            }
        } else {
            query = query.order(sync_log_dsl::started_datetime.asc())
        }
        let result = query
            .offset(pagination.offset as i64)
            .limit(pagination.limit as i64)
            .load::<SyncLogRow>(&self.connection.connection)?;

        Ok(result.into_iter().map(to_domain).collect())
    }
}

type BoxedSyncLogQuery = sync_log::BoxedQuery<'static, DBType>;

fn create_filtered_query(filter: Option<SyncLogFilter>) -> BoxedSyncLogQuery {
    let mut query = sync_log::table.into_boxed();

    if let Some(f) = filter {
        let SyncLogFilter {
            id,
            prepare_initial_done_datetime,
        } = f;
        apply_equal_filter!(query, id, sync_log_dsl::id);
        apply_date_time_filter!(
            query,
            prepare_initial_done_datetime,
            sync_log_dsl::prepare_initial_done_datetime
        );
    }

    query
}

fn to_domain(sync_log_row: SyncLogRow) -> SyncLog {
    SyncLog { sync_log_row }
}

impl SyncLogFilter {
    pub fn new() -> SyncLogFilter {
        SyncLogFilter::default()
    }

    pub fn prepare_initial_done_datetime(mut self, value: DatetimeFilter) -> SyncLogFilter {
        self.prepare_initial_done_datetime = Some(value);
        self
    }
}
