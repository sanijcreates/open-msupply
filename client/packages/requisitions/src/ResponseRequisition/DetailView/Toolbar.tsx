import React, { Dispatch, SetStateAction } from 'react';
import {
  AppBarContentPortal,
  Box,
  InputWithLabelRow,
  BasicTextInput,
  Grid,
  DropdownMenu,
  DropdownMenuItem,
  DeleteIcon,
  useTranslation,
  useNotification,
  useTableStore,
  SearchBar,
} from '@openmsupply-client/common';
import { CustomerSearchInput } from '@openmsupply-client/system';

import {
  useResponseFields,
  useIsResponseDisabled,
  ResponseLineFragment,
} from '../api';

interface ToolbarProps {
  filter: {
    itemFilter: string;
    setItemFilter: Dispatch<SetStateAction<string>>;
  };
}

export const Toolbar = ({
  filter: { itemFilter, setItemFilter },
}: ToolbarProps) => {
  const t = useTranslation(['distribution', 'common']);
  const { success, info } = useNotification();
  const isDisabled = useIsResponseDisabled();
  const { lines, otherParty, theirReference, update } = useResponseFields([
    'lines',
    'otherParty',
    'theirReference',
  ]);

  const { selectedRows } = useTableStore(state => ({
    selectedRows: Object.keys(state.rowState)
      .filter(id => state.rowState[id]?.isSelected)
      .map(selectedId => lines.nodes.find(({ id }) => selectedId === id))
      .filter(Boolean) as ResponseLineFragment[],
  }));

  const deleteAction = () => {
    if (selectedRows && selectedRows?.length > 0) {
      const successSnack = success(`Deleted ${selectedRows?.length} lines`);
      successSnack();
    } else {
      const infoSnack = info(t('label.select-rows-to-delete-them'));
      infoSnack();
    }
  };

  return (
    <AppBarContentPortal sx={{ display: 'flex', flex: 1, marginBottom: 1 }}>
      <Grid
        container
        flexDirection="row"
        display="flex"
        flex={1}
        alignItems="flex-end"
      >
        <Grid item display="flex" flex={1}>
          <Box display="flex" flexDirection="row" gap={4}>
            <Box display="flex" flex={1} flexDirection="column" gap={1}>
              {otherParty && (
                <InputWithLabelRow
                  label={t('label.customer-name')}
                  Input={
                    <CustomerSearchInput
                      disabled
                      value={otherParty}
                      onChange={newOtherParty => {
                        update({ otherParty: newOtherParty });
                      }}
                    />
                  }
                />
              )}
              <InputWithLabelRow
                label={t('label.customer-ref')}
                Input={
                  <BasicTextInput
                    disabled={isDisabled}
                    size="small"
                    sx={{ width: 250 }}
                    value={theirReference}
                    onChange={e => update({ theirReference: e.target.value })}
                  />
                }
              />
            </Box>
          </Box>
        </Grid>
        <SearchBar
          placeholder={t('placeholder.filter-items')}
          value={itemFilter}
          onChange={newValue => {
            setItemFilter(newValue);
          }}
          debounceTime={0}
        />
        <DropdownMenu disabled={isDisabled} label={t('label.select')}>
          <DropdownMenuItem IconComponent={DeleteIcon} onClick={deleteAction}>
            {t('button.delete-lines', { ns: 'distribution' })}
          </DropdownMenuItem>
        </DropdownMenu>
      </Grid>
    </AppBarContentPortal>
  );
};
