import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowRightIcon,
  useTranslation,
  useNotification,
  SplitButton,
  SplitButtonOption,
  useConfirmationModal,
  RequisitionNodeStatus,
} from '@openmsupply-client/common';
import {
  getNextResponseRequisitionStatus,
  getStatusTranslation,
} from '../../../utils';
import {
  useIsResponseRequisitionDisabled,
  useResponseRequisitionFields,
} from '../../api';

const getStatusOptions = (
  currentStatus: RequisitionNodeStatus,
  getButtonLabel: (status: RequisitionNodeStatus) => string
): SplitButtonOption<RequisitionNodeStatus>[] => {
  const options: [
    SplitButtonOption<RequisitionNodeStatus>,
    SplitButtonOption<RequisitionNodeStatus>
  ] = [
    {
      value: RequisitionNodeStatus.New,
      label: getButtonLabel(RequisitionNodeStatus.Draft),
      isDisabled: true,
    },
    {
      value: RequisitionNodeStatus.Finalised,
      label: getButtonLabel(RequisitionNodeStatus.Finalised),
      isDisabled: true,
    },
  ];

  if (currentStatus === RequisitionNodeStatus.New) {
    options[1].isDisabled = false;
  }

  return options;
};

const getNextStatusOption = (
  status: RequisitionNodeStatus,
  options: SplitButtonOption<RequisitionNodeStatus>[]
): SplitButtonOption<RequisitionNodeStatus> | null => {
  if (!status) return options[0] ?? null;

  const nextStatus = getNextResponseRequisitionStatus(status);
  console.log('nextStatus', nextStatus);
  const nextStatusOption = options.find(o => o.value === nextStatus);
  return nextStatusOption || null;
};

const getButtonLabel =
  (t: ReturnType<typeof useTranslation>) =>
  (invoiceStatus: RequisitionNodeStatus): string => {
    return t('button.save-and-confirm-status', {
      status: t(getStatusTranslation(invoiceStatus)),
    });
  };

const useStatusChangeButton = () => {
  const { status, update } = useResponseRequisitionFields('status');
  const { success, error } = useNotification();
  const t = useTranslation('replenishment');

  const options = useMemo(
    () => getStatusOptions(status, getButtonLabel(t)),
    [status, getButtonLabel]
  );

  const [selectedOption, setSelectedOption] =
    useState<SplitButtonOption<RequisitionNodeStatus> | null>(() =>
      getNextStatusOption(status, options)
    );

  const onConfirmStatusChange = async () => {
    if (!selectedOption) return null;
    try {
      await update({ status: selectedOption.value });
      success(t('message.saved'))();
    } catch (e) {
      error(t('message.could-not-save'))();
    }
  };

  const onGetConfirmation = useConfirmationModal({
    title: t('heading.are-you-sure'),
    message: t('message.confirm-status-as', {
      status: selectedOption?.value
        ? getStatusTranslation(selectedOption?.value)
        : '',
    }),
    onConfirm: onConfirmStatusChange,
  });

  // When the status of the invoice changes (after an update), set the selected option to the next status.
  // It would be set to the current status, which is now a disabled option.
  useEffect(() => {
    setSelectedOption(() => getNextStatusOption(status, options));
  }, [status, options]);

  return { options, selectedOption, setSelectedOption, onGetConfirmation };
};

export const StatusChangeButton = () => {
  const { options, selectedOption, setSelectedOption, onGetConfirmation } =
    useStatusChangeButton();
  const isDisabled = useIsResponseRequisitionDisabled();

  console.log(selectedOption);

  if (!selectedOption) return null;
  if (isDisabled) return null;

  return (
    <SplitButton
      options={options}
      selectedOption={selectedOption}
      onSelectOption={setSelectedOption}
      Icon={<ArrowRightIcon />}
      onClick={onGetConfirmation}
    />
  );
};
