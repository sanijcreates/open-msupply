import React, { FC, useEffect } from 'react';

import { useNavigate, useParams } from 'react-router';

import {
  Portal,
  Transaction,
  Typography,
  useDetailPanel,
  useHostContext,
  useQueryClient,
} from '@openmsupply-client/common';

import { detailQueryFn, updateFn } from '../../api';
import { createDraftStore, useDraftDocument } from '../../useDraftDocument';

const placeholderTransaction: Transaction = {
  name: '',
  total: '',
  comment: '',
  color: 'grey',
  status: '',
  type: '',
  entered: '',
  confirmed: '',
  invoiceNumber: '',
};

const useDraft = createDraftStore<Transaction>();

const useDraftOutbound = (id: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { draft, setDraft, save } = useDraftDocument(
    ['transaction', id],
    detailQueryFn(id ?? ''),
    updateFn,

    // On successfully saving the draft, check if we had just saved a new
    // record - this is indicated by the record having no `id` field.
    // If there was an id field, we would be updating rather than creating.
    // If we did just save a newly created record, replace the current
    // url with the new id of the record. For example, if we are creating
    // an outbound shipment, we would start with the URL:
    // outbound-shipment/new
    // and once saved, we replace the url with the new invoice number
    // outbound-shipment/{invoice_number}
    // This will cause the query key to update, and everything from this
    // point is exactly the same as when editing an existing invoice.
    (data, variables) => {
      if (!variables.id) {
        navigate({ pathname: `../${data.id}` }, { replace: true });
      }

      queryClient.invalidateQueries('transaction');
    },
    useDraft,
    id === 'new' ? placeholderTransaction : undefined
  );

  return { draft, setDraft, save };
};

export const OutboundShipmentDetailView: FC = () => {
  const { id } = useParams();
  const { draft, setDraft, save } = useDraftOutbound(id ?? 'new');
  const { appBarButtonsRef } = useHostContext();
  const { OpenButton, setSections } = useDetailPanel();

  useEffect(() => {
    setSections([
      {
        titleKey: 'heading.comment',
        children: [<Typography key="comment">Comments go here..</Typography>],
      },
      {
        titleKey: 'heading.additional-info',
        children: [<Typography key="comment">Additional Info..</Typography>],
      },
    ]);
    // clean up on unload: will hide the details panel
    return () => setSections([]);
  }, []);

  return draft ? (
    <>
      <Portal container={appBarButtonsRef?.current}>
        <>{OpenButton}</>
      </Portal>
      <div>
        <input
          value={draft?.name}
          onChange={event => setDraft({ ...draft, name: event?.target.value })}
        />
      </div>
      <div>
        <span>{JSON.stringify(draft, null, 4) ?? ''}</span>
      </div>
      <div>
        <button onClick={save}>OK</button>
      </div>
    </>
  ) : null;
};
