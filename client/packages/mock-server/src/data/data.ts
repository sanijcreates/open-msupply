/* eslint-disable prefer-const */
import { Store, StockLine, Invoice, Item, InvoiceLine, Name } from './types';
import {
  addRandomPercentageTo,
  alphaString,
  getFilter,
  randomInteger,
  roundDecimalPlaces,
} from './../utils';
import faker from 'faker';
import {
  takeRandomElementFrom,
  takeRandomNumberFrom,
  takeRandomPercentageFrom,
  takeRandomSubsetFrom,
} from '../utils';
import { items } from './items';
import { comments } from './comments';
import { names } from './names';

export const getStockLinesForItem = (
  item: Item,
  stockLines: StockLine[] = StockLineData
): StockLine[] => {
  return stockLines.filter(getFilter(item.id, 'itemId'));
};

export const createStockLines = (
  items: Item[],
  stores: Store[]
): StockLine[] => {
  const stockLines: StockLine[] = [];

  stores.forEach(store => {
    items.forEach(item => {
      const { id: itemId } = item;

      // Take a random quantity we're going to use of this items total available.
      // to distribute over all the stock lines we will create.
      let quantityToUse = takeRandomNumberFrom(100, 500);
      let i = 0;

      while (quantityToUse > 0) {
        // Take another random amount from the total quantity for this stock line. We create a random number of
        // stock lines by taking a random quantity (min of 10%) from the pool of available quantity.
        const quantityForThisBatch = takeRandomPercentageFrom(quantityToUse, {
          minPercentage: 10,
        });

        // Use the remaining available if we generated a quantity for this stock line greater than the available
        // quantity.
        const availableNumberOfPacks =
          quantityForThisBatch > quantityToUse
            ? quantityToUse
            : quantityForThisBatch;

        const costPricePerPack = randomInteger({ min: 10, max: 1000 }) / 100;
        const sellPricePerPack = roundDecimalPlaces(
          addRandomPercentageTo({ value: costPricePerPack, min: 10, max: 40 }),
          2
        );

        const stockLine = {
          id: `${itemId}-${store.id}-${i++}`,
          name: `${itemId}-${i++}`,
          packSize: 1,
          expiryDate: faker.date.future(0.5).toISOString(),
          batch: `${alphaString(4)}${faker.datatype.number(1000)}`,
          storeId: store.id,
          availableNumberOfPacks,
          totalNumberOfPacks:
            availableNumberOfPacks + randomInteger({ min: 0, max: 5 }),
          itemId,
          costPricePerPack,
          sellPricePerPack,
        } as StockLine;

        quantityToUse = quantityToUse - availableNumberOfPacks;

        stockLines.push(stockLine);
      }
    });
  });

  return stockLines.flat();
};

export const createInvoiceLines = (
  items: Item[],
  stockLines: StockLine[],
  invoices: Invoice[]
): InvoiceLine[] => {
  const invoiceLines: InvoiceLine[][] = [];

  invoices.forEach(invoice => {
    takeRandomSubsetFrom(items, 10).forEach(item => {
      const stockLinesToUse = takeRandomSubsetFrom(
        getStockLinesForItem(item, stockLines)
      );

      const invoiceLinesForStockLines = stockLinesToUse.map(
        (stockLine: Omit<StockLine, 'item'>) => {
          const { availableNumberOfPacks } = stockLine;

          const numberOfPacks = takeRandomPercentageFrom(
            availableNumberOfPacks as number
          );

          const costPricePerPack = randomInteger({ min: 10, max: 1000 }) / 100;
          const sellPricePerPack = roundDecimalPlaces(
            addRandomPercentageTo({
              value: costPricePerPack,
              min: 10,
              max: 40,
            }),
            2
          );

          const invoiceLine = {
            id: `${faker.datatype.uuid()}`,
            invoiceId: invoice.id,
            itemId: item.id,
            itemName: item.name,
            itemCode: item.code,

            stockLineId: stockLine.id,

            batch: stockLine.name,
            expiry: stockLine.expiryDate,

            costPricePerPack,
            sellPricePerPack,
            totalAfterTax: sellPricePerPack * numberOfPacks,
            quantity: numberOfPacks,
            numberOfPacks,
            packSize: 1,
          } as InvoiceLine;

          stockLine.availableNumberOfPacks =
            (stockLine.availableNumberOfPacks as number) - numberOfPacks;

          return invoiceLine;
        }
      );

      invoiceLines.push(invoiceLinesForStockLines);
    });
  });

  return invoiceLines.flat();
};

export const createItems = (
  numberToCreate = randomInteger({ min: 25, max: 50 })
): Item[] => {
  return items.slice(0, numberToCreate).map(({ code, name }, j) => {
    const itemId = `item-${j}`;

    const item = {
      id: itemId,
      code,
      name,
      isVisible: faker.datatype.boolean(),
    };

    return item;
  });
};

const statuses = ['DRAFT', 'CONFIRMED', 'FINALISED'];

export const createInvoice = (
  id: string,
  invoiceNumber: number,
  nameId: string,
  storeId: string,
  seeded?: Partial<Invoice>
): Invoice => {
  const confirmed = faker.date.past(1);
  const entered = faker.date.past(0.25, confirmed);

  return {
    id,
    nameId,
    invoiceNumber,
    status: takeRandomElementFrom(statuses),
    entryDatetime: entered.toISOString(),
    confirmedDatetime: confirmed.toISOString(),
    finalisedDatetime: null,
    pricing: { totalAfterTax: faker.commerce.price() },
    color: 'grey',
    type: 'CUSTOMER_INVOICE',
    comment: takeRandomElementFrom(comments),
    hold: false,
    storeId,
    ...seeded,
  };
};

export const createInvoices = (
  customers = NameData,
  stores: Store[],
  numberToCreate = randomInteger({ min: 10, max: 10 })
): Invoice[] => {
  const invoices = stores
    .map(store => {
      return Array.from({ length: numberToCreate }).map((_, i) => {
        const name = takeRandomElementFrom(customers);
        const invoice = createInvoice(
          faker.datatype.uuid(),
          i,
          name.id,
          store.id
        );

        return invoice;
      });
    })
    .flat();

  return invoices;
};

export const createNames = (
  numberToCreate = randomInteger({ min: 10, max: 100 })
): Name[] => {
  const getNameAndCode = () => {
    return takeRandomElementFrom(names);
  };

  return Array.from({ length: numberToCreate }).map((_, i) => {
    const { name, code } = getNameAndCode();
    const isCustomer = faker.datatype.boolean();
    return {
      id: `${i}`,
      name,
      code,
      isCustomer,
      isSupplier: !isCustomer,
    };
  });
};

export const removeElement = (source: any[], idx: number): void => {
  source = source.splice(idx, 1);
};

const createStores = (names: Name[]): Store[] => {
  const suppliers = names.filter(({ isSupplier }) => isSupplier);

  const stores: Store[] = suppliers.map(({ id, code }) => ({
    id,
    nameId: id,
    code,
  }));

  return stores;
};

export let NameData = createNames();
export let ItemData = createItems();
export let StoreData = createStores(NameData);
export let StockLineData = createStockLines(ItemData, StoreData);
export let InvoiceData = createInvoices(NameData, StoreData);
export let InvoiceLineData = createInvoiceLines(
  ItemData,
  StockLineData,
  InvoiceData
);
