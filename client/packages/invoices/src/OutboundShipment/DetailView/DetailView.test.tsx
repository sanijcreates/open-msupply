import React from 'react';
import { Route } from 'react-router';
import { render, waitFor } from '@testing-library/react';
import AppBar from '@openmsupply-client/host/src/AppBar';
import { TestingProvider, TestingRouter } from '@openmsupply-client/common';

import { OutboundShipmentDetailView } from './DetailView';
import { act } from 'react-dom/test-utils';

describe('OutboundShipmentDetailView', () => {
  const ExampleDetailView = () => (
    <TestingProvider>
      <TestingRouter initialEntries={['/distribution/outbound-shipment/3']}>
        <Route path="distribution/outbound-shipment">
          <Route
            path={':id'}
            element={
              <>
                <AppBar />
                <OutboundShipmentDetailView />
              </>
            }
          />
        </Route>
      </TestingRouter>
    </TestingProvider>
  );

  it('initially renders the general tab panel', async () => {
    const { getByRole } = render(<ExampleDetailView />);

    await waitFor(() => {
      const generalTab = getByRole('tabpanel', { name: /general/i });
      expect(generalTab).toBeInTheDocument();
    });
  });

  it('initially the general tab panel is the only panel rendered', async () => {
    const { queryAllByRole } = render(<ExampleDetailView />);

    await waitFor(() => {
      const allTabPanels = queryAllByRole('tabpanel');

      expect(allTabPanels.length).toEqual(1);
    });
  });

  it('renders the transport details content once the transport tab has been pressed', async () => {
    const { getByRole } = render(<ExampleDetailView />);

    await waitFor(() => {
      const transportTabButton = getByRole('tab', { name: /transport/i });

      act(() => {
        transportTabButton.click();
      });

      const transportPanel = getByRole('tabpanel', { name: /transport/i });
      expect(transportPanel).toBeInTheDocument();
    });
  });
});