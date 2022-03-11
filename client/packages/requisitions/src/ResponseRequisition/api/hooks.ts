import { AppRoute } from '@openmsupply-client/config';
import { useMemo } from 'react';
import {
  RouteBuilder,
  useOpenInNewTab,
  useQueryClient,
  useAuthContext,
  useParams,
  useGql,
  UseQueryResult,
  useQuery,
  FieldSelectorControl,
  useFieldsSelector,
  SortController,
  getColumnSorter,
  useQueryParams,
  useMutation,
  useNotification,
  useTranslation,
  Column,
} from '@openmsupply-client/common';
import { getResponseQueries, ListParams } from './api';
import { isResponseDisabled } from './../../utils';
import {
  getSdk,
  ResponseFragment,
  ResponseLineFragment,
  ResponseRowFragment,
} from './operations.generated';
import { useResponseColumns } from '../DetailView/columns';

export const useResponseApi = () => {
  const keys = {
    base: () => ['response'] as const,
    detail: (id: string) => [...keys.base(), storeId, id] as const,
    list: () => [...keys.base(), storeId, 'list'] as const,
    paramList: (params: ListParams) => [...keys.list(), params] as const,
  };

  const { client } = useGql();
  const sdk = getSdk(client);
  const { storeId } = useAuthContext();
  const queries = getResponseQueries(sdk, storeId);

  return { ...queries, storeId, keys };
};

const useResponseNumber = () => {
  const { requisitionNumber = '' } = useParams();
  return requisitionNumber;
};

export const useUpdateResponse = () => {
  const queryClient = useQueryClient();
  const api = useResponseApi();
  return useMutation(api.update, {
    onSuccess: () => queryClient.invalidateQueries(api.keys.base()),
  });
};

export const useResponses = () => {
  const queryParams = useQueryParams<ResponseRowFragment>({
    initialSortBy: { key: 'otherPartyName' },
  });
  const api = useResponseApi();

  return {
    ...useQuery(api.keys.paramList(queryParams), () =>
      api.get.list({
        first: queryParams.first,
        offset: queryParams.offset,
        sortBy: queryParams.sortBy,
        filterBy: queryParams.filter.filterBy,
      })
    ),
    ...queryParams,
  };
};

export const useResponse = (): UseQueryResult<ResponseFragment> => {
  const responseNumber = useResponseNumber();
  const api = useResponseApi();
  return useQuery(api.keys.detail(responseNumber), () =>
    api.get.byNumber(responseNumber)
  );
};

export const useResponseFields = <
  KeyOfRequisition extends keyof ResponseFragment
>(
  keys: KeyOfRequisition | KeyOfRequisition[]
): FieldSelectorControl<ResponseFragment, KeyOfRequisition> => {
  const { data } = useResponse();
  const responseNumber = useResponseNumber();
  const api = useResponseApi();

  return useFieldsSelector(
    api.keys.detail(responseNumber),
    () => api.get.byNumber(responseNumber),
    (patch: Partial<ResponseFragment>) =>
      api.update({ ...patch, id: data?.id ?? '' }),
    keys
  );
};

interface UseResponseLinesController
  extends SortController<ResponseLineFragment> {
  lines: ResponseLineFragment[];
  columns: Column<ResponseLineFragment>[];
}

export const useResponseLines = (): UseResponseLinesController => {
  const { lines } = useResponseFields('lines');
  const { columns, onChangeSortBy, sortBy } = useResponseColumns();

  const sorted = useMemo(() => {
    const currentColumn = columns.find(({ key }) => key === sortBy.key);
    const { getSortValue } = currentColumn ?? {};
    return getSortValue
      ? lines?.nodes.sort(getColumnSorter(getSortValue, !!sortBy.isDesc))
      : lines?.nodes;
  }, [sortBy.key, sortBy.isDesc, lines]);

  return { lines: sorted, sortBy, onChangeSortBy, columns };
};

export const useIsResponseDisabled = (): boolean => {
  const { data } = useResponse();
  if (!data) return true;
  return isResponseDisabled(data);
};

export const useSaveResponseLines = () => {
  const responseNumber = useResponseNumber();
  const queryClient = useQueryClient();
  const api = useResponseApi();

  return useMutation(api.updateLine, {
    onSuccess: () =>
      queryClient.invalidateQueries(api.keys.detail(responseNumber)),
  });
};

export const useCreateOutboundFromResponse = () => {
  const { error, warning } = useNotification();
  const t = useTranslation('distribution');
  const openInNewTab = useOpenInNewTab();
  const { id } = useResponseFields('id');
  const api = useResponseApi();
  return useMutation(() => api.createOutboundFromResponse(id), {
    onSuccess: (invoiceNumber: number) => {
      openInNewTab(
        RouteBuilder.create(AppRoute.Distribution)
          .addPart(AppRoute.OutboundShipment)
          .addPart(String(invoiceNumber))
          .build()
      );
    },
    onError: e => {
      const errorObj = e as Error;
      if (errorObj.message === 'NothingRemainingToSupply') {
        warning(t('warning.nothing-to-supply'))();
      } else {
        error(t('error.failed-to-create-outbound'))();
      }
    },
  });
};
