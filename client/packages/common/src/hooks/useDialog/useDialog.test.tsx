import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { TestingProvider } from '@openmsupply-client/common';

import { useDialog } from './useDialog';
import { DialogButton } from '../../ui/components/buttons/DialogButton';

describe('useDialog', () => {
  const DialogExample: React.FC = () => {
    const { hideDialog, Modal, showDialog } = useDialog({
      title: 'heading.add-item',
    });

    return (
      <div>
        <Modal
          cancelButton={<DialogButton variant="cancel" onClick={hideDialog} />}
        >
          <div>dialog body context</div>
        </Modal>
        <button onClick={showDialog}>show dialog</button>
      </div>
    );
  };

  it('Dialog not shown when first rendered', () => {
    const { queryByText } = render(
      <TestingProvider>
        <DialogExample />
      </TestingProvider>
    );

    expect(queryByText(/dialog body context/i)).not.toBeInTheDocument();
  });

  it('Dialog is shown when requested', () => {
    const { getByRole } = render(
      <TestingProvider>
        <DialogExample />
      </TestingProvider>
    );

    act(() => getByRole('button', { name: 'show dialog' }).click());

    const node = getByRole(/dialog/, { name: /add item/i });
    expect(node).toBeInTheDocument();
  });

  it('Cancel button is shown', () => {
    const { getByRole } = render(
      <TestingProvider>
        <DialogExample />
      </TestingProvider>
    );

    act(() => getByRole('button', { name: 'show dialog' }).click());

    expect(getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('Dialog is hidden when cancelled', async () => {
    const { getByRole, queryByText } = render(
      <TestingProvider>
        <DialogExample />
      </TestingProvider>
    );

    act(() => getByRole('button', { name: 'show dialog' }).click());

    act(() => getByRole('button', { name: 'Cancel' }).click());

    await waitFor(() => {
      expect(queryByText(/dialog body context/i)).not.toBeInTheDocument();
    });
  });
});