import * as Types from '@openmsupply-client/common';

import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
import { graphql, ResponseResolver, GraphQLRequest, GraphQLContext } from 'msw'
export type UpdateResponseMutationVariables = Types.Exact<{
  storeId: Types.Scalars['String'];
  input: Types.UpdateResponseRequisitionInput;
}>;


export type UpdateResponseMutation = { __typename: 'FullMutation', updateResponseRequisition: { __typename: 'RequisitionNode', id: string } | { __typename: 'UpdateResponseRequisitionError' } };

export type ResponseLineFragment = { __typename: 'RequisitionLineNode', id: string, itemId: string, requestedQuantity: number, supplyQuantity: number, remainingQuantityToSupply: number, comment?: string | null, itemStats: { __typename: 'ItemStatsNode', availableStockOnHand: number, availableMonthsOfStockOnHand: number, averageMonthlyConsumption: number }, item: { __typename: 'ItemNode', id: string, name: string, code: string, unitName?: string | null }, linkedRequisitionLine?: { __typename: 'RequisitionLineNode', itemStats: { __typename: 'ItemStatsNode', availableStockOnHand: number } } | null };

export type ResponseFragment = { __typename: 'RequisitionNode', id: string, type: Types.RequisitionNodeType, status: Types.RequisitionNodeStatus, createdDatetime: string, sentDatetime?: string | null, finalisedDatetime?: string | null, requisitionNumber: number, colour?: string | null, theirReference?: string | null, comment?: string | null, otherPartyName: string, otherPartyId: string, maxMonthsOfStock: number, minMonthsOfStock: number, user?: { __typename: 'UserNode', username: string, email?: string | null } | null, shipments: { __typename: 'InvoiceConnector', totalCount: number, nodes: Array<{ __typename: 'InvoiceNode', id: string, invoiceNumber: number, createdDatetime: string, user?: { __typename: 'UserNode', username: string } | null }> }, linesRemainingToSupply: { __typename: 'RequisitionLineConnector', totalCount: number }, lines: { __typename: 'RequisitionLineConnector', totalCount: number, nodes: Array<{ __typename: 'RequisitionLineNode', id: string, itemId: string, requestedQuantity: number, supplyQuantity: number, remainingQuantityToSupply: number, comment?: string | null, itemStats: { __typename: 'ItemStatsNode', availableStockOnHand: number, availableMonthsOfStockOnHand: number, averageMonthlyConsumption: number }, item: { __typename: 'ItemNode', id: string, name: string, code: string, unitName?: string | null }, linkedRequisitionLine?: { __typename: 'RequisitionLineNode', itemStats: { __typename: 'ItemStatsNode', availableStockOnHand: number } } | null }> }, otherParty: { __typename: 'NameNode', id: string, code: string, isCustomer: boolean, isSupplier: boolean, name: string, store?: { __typename: 'StoreNode', id: string, code: string } | null } };

export type ResponseByNumberQueryVariables = Types.Exact<{
  storeId: Types.Scalars['String'];
  requisitionNumber: Types.Scalars['Int'];
}>;


export type ResponseByNumberQuery = { __typename: 'FullQuery', requisitionByNumber: { __typename: 'RecordNotFound' } | { __typename: 'RequisitionNode', id: string, type: Types.RequisitionNodeType, status: Types.RequisitionNodeStatus, createdDatetime: string, sentDatetime?: string | null, finalisedDatetime?: string | null, requisitionNumber: number, colour?: string | null, theirReference?: string | null, comment?: string | null, otherPartyName: string, otherPartyId: string, maxMonthsOfStock: number, minMonthsOfStock: number, user?: { __typename: 'UserNode', username: string, email?: string | null } | null, shipments: { __typename: 'InvoiceConnector', totalCount: number, nodes: Array<{ __typename: 'InvoiceNode', id: string, invoiceNumber: number, createdDatetime: string, user?: { __typename: 'UserNode', username: string } | null }> }, linesRemainingToSupply: { __typename: 'RequisitionLineConnector', totalCount: number }, lines: { __typename: 'RequisitionLineConnector', totalCount: number, nodes: Array<{ __typename: 'RequisitionLineNode', id: string, itemId: string, requestedQuantity: number, supplyQuantity: number, remainingQuantityToSupply: number, comment?: string | null, itemStats: { __typename: 'ItemStatsNode', availableStockOnHand: number, availableMonthsOfStockOnHand: number, averageMonthlyConsumption: number }, item: { __typename: 'ItemNode', id: string, name: string, code: string, unitName?: string | null }, linkedRequisitionLine?: { __typename: 'RequisitionLineNode', itemStats: { __typename: 'ItemStatsNode', availableStockOnHand: number } } | null }> }, otherParty: { __typename: 'NameNode', id: string, code: string, isCustomer: boolean, isSupplier: boolean, name: string, store?: { __typename: 'StoreNode', id: string, code: string } | null } } };

export type ResponseRowFragment = { __typename: 'RequisitionNode', colour?: string | null, comment?: string | null, createdDatetime: string, finalisedDatetime?: string | null, id: string, otherPartyName: string, requisitionNumber: number, sentDatetime?: string | null, status: Types.RequisitionNodeStatus, theirReference?: string | null, type: Types.RequisitionNodeType, otherPartyId: string };

export type ResponsesQueryVariables = Types.Exact<{
  storeId: Types.Scalars['String'];
  filter?: Types.InputMaybe<Types.RequisitionFilterInput>;
  page?: Types.InputMaybe<Types.PaginationInput>;
  sort?: Types.InputMaybe<Array<Types.RequisitionSortInput> | Types.RequisitionSortInput>;
}>;


export type ResponsesQuery = { __typename: 'FullQuery', requisitions: { __typename: 'RequisitionConnector', totalCount: number, nodes: Array<{ __typename: 'RequisitionNode', colour?: string | null, comment?: string | null, createdDatetime: string, finalisedDatetime?: string | null, id: string, otherPartyName: string, requisitionNumber: number, sentDatetime?: string | null, status: Types.RequisitionNodeStatus, theirReference?: string | null, type: Types.RequisitionNodeType, otherPartyId: string }> } };

export type UpdateResponseLineMutationVariables = Types.Exact<{
  storeId: Types.Scalars['String'];
  input: Types.UpdateResponseRequisitionLineInput;
}>;


export type UpdateResponseLineMutation = { __typename: 'FullMutation', updateResponseRequisitionLine: { __typename: 'RequisitionLineNode', id: string } | { __typename: 'UpdateResponseRequisitionLineError', error: { __typename: 'CannotEditRequisition', description: string } | { __typename: 'ForeignKeyError', description: string, key: Types.ForeignKey } | { __typename: 'RecordNotFound', description: string } } };

export type CreateOutboundFromResponseMutationVariables = Types.Exact<{
  responseId: Types.Scalars['String'];
  storeId: Types.Scalars['String'];
}>;


export type CreateOutboundFromResponseMutation = { __typename: 'FullMutation', createRequisitionShipment: { __typename: 'CreateRequisitionShipmentError', error: { __typename: 'CannotEditRequisition', description: string } | { __typename: 'NothingRemainingToSupply', description: string } | { __typename: 'RecordNotFound', description: string } } | { __typename: 'InvoiceNode', id: string, invoiceNumber: number } };

export const ResponseLineFragmentDoc = gql`
    fragment ResponseLine on RequisitionLineNode {
  id
  itemId
  requestedQuantity
  supplyQuantity
  remainingQuantityToSupply
  comment
  itemStats {
    __typename
    availableStockOnHand
    availableMonthsOfStockOnHand
    averageMonthlyConsumption
  }
  item {
    id
    name
    code
    unitName
  }
  linkedRequisitionLine {
    itemStats {
      availableStockOnHand
    }
  }
}
    `;
export const ResponseFragmentDoc = gql`
    fragment Response on RequisitionNode {
  __typename
  id
  type
  status
  createdDatetime
  sentDatetime
  finalisedDatetime
  requisitionNumber
  colour
  theirReference
  comment
  otherPartyName
  otherPartyId
  maxMonthsOfStock
  minMonthsOfStock
  user {
    __typename
    username
    email
  }
  shipments {
    __typename
    totalCount
    nodes {
      __typename
      id
      invoiceNumber
      createdDatetime
      user {
        __typename
        username
      }
    }
  }
  linesRemainingToSupply {
    __typename
    totalCount
  }
  lines {
    __typename
    ... on RequisitionLineConnector {
      totalCount
      nodes {
        ...ResponseLine
      }
    }
  }
  otherParty(storeId: $storeId) {
    __typename
    id
    code
    isCustomer
    isSupplier
    name
    store {
      id
      code
    }
  }
}
    ${ResponseLineFragmentDoc}`;
export const ResponseRowFragmentDoc = gql`
    fragment ResponseRow on RequisitionNode {
  colour
  comment
  createdDatetime
  finalisedDatetime
  id
  otherPartyName
  requisitionNumber
  sentDatetime
  status
  theirReference
  type
  otherPartyId
}
    `;
export const UpdateResponseDocument = gql`
    mutation updateResponse($storeId: String!, $input: UpdateResponseRequisitionInput!) {
  updateResponseRequisition(input: $input, storeId: $storeId) {
    ... on RequisitionNode {
      __typename
      id
    }
  }
}
    `;
export const ResponseByNumberDocument = gql`
    query responseByNumber($storeId: String!, $requisitionNumber: Int!) {
  requisitionByNumber(
    requisitionNumber: $requisitionNumber
    type: RESPONSE
    storeId: $storeId
  ) {
    __typename
    ... on RequisitionNode {
      ...Response
    }
  }
}
    ${ResponseFragmentDoc}`;
export const ResponsesDocument = gql`
    query responses($storeId: String!, $filter: RequisitionFilterInput, $page: PaginationInput, $sort: [RequisitionSortInput!]) {
  requisitions(storeId: $storeId, filter: $filter, page: $page, sort: $sort) {
    ... on RequisitionConnector {
      totalCount
      nodes {
        ...ResponseRow
      }
    }
  }
}
    ${ResponseRowFragmentDoc}`;
export const UpdateResponseLineDocument = gql`
    mutation updateResponseLine($storeId: String!, $input: UpdateResponseRequisitionLineInput!) {
  updateResponseRequisitionLine(input: $input, storeId: $storeId) {
    ... on RequisitionLineNode {
      __typename
      id
    }
    ... on UpdateResponseRequisitionLineError {
      __typename
      error {
        description
        ... on CannotEditRequisition {
          __typename
          description
        }
        ... on ForeignKeyError {
          __typename
          description
          key
        }
        ... on RecordNotFound {
          __typename
          description
        }
      }
    }
  }
}
    `;
export const CreateOutboundFromResponseDocument = gql`
    mutation createOutboundFromResponse($responseId: String!, $storeId: String!) {
  createRequisitionShipment(
    input: {responseRequisitionId: $responseId}
    storeId: $storeId
  ) {
    __typename
    ... on InvoiceNode {
      __typename
      id
      invoiceNumber
    }
    ... on CreateRequisitionShipmentError {
      __typename
      error {
        description
        ... on CannotEditRequisition {
          __typename
          description
        }
        ... on NothingRemainingToSupply {
          __typename
          description
        }
        ... on RecordNotFound {
          __typename
          description
        }
      }
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    updateResponse(variables: UpdateResponseMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateResponseMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateResponseMutation>(UpdateResponseDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'updateResponse');
    },
    responseByNumber(variables: ResponseByNumberQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ResponseByNumberQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ResponseByNumberQuery>(ResponseByNumberDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'responseByNumber');
    },
    responses(variables: ResponsesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ResponsesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ResponsesQuery>(ResponsesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'responses');
    },
    updateResponseLine(variables: UpdateResponseLineMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UpdateResponseLineMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateResponseLineMutation>(UpdateResponseLineDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'updateResponseLine');
    },
    createOutboundFromResponse(variables: CreateOutboundFromResponseMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<CreateOutboundFromResponseMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateOutboundFromResponseMutation>(CreateOutboundFromResponseDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'createOutboundFromResponse');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;

/**
 * @param resolver a function that accepts a captured request and may return a mocked response.
 * @see https://mswjs.io/docs/basics/response-resolver
 * @example
 * mockUpdateResponseMutation((req, res, ctx) => {
 *   const { storeId, input } = req.variables;
 *   return res(
 *     ctx.data({ updateResponseRequisition })
 *   )
 * })
 */
export const mockUpdateResponseMutation = (resolver: ResponseResolver<GraphQLRequest<UpdateResponseMutationVariables>, GraphQLContext<UpdateResponseMutation>, any>) =>
  graphql.mutation<UpdateResponseMutation, UpdateResponseMutationVariables>(
    'updateResponse',
    resolver
  )

/**
 * @param resolver a function that accepts a captured request and may return a mocked response.
 * @see https://mswjs.io/docs/basics/response-resolver
 * @example
 * mockResponseByNumberQuery((req, res, ctx) => {
 *   const { storeId, requisitionNumber } = req.variables;
 *   return res(
 *     ctx.data({ requisitionByNumber })
 *   )
 * })
 */
export const mockResponseByNumberQuery = (resolver: ResponseResolver<GraphQLRequest<ResponseByNumberQueryVariables>, GraphQLContext<ResponseByNumberQuery>, any>) =>
  graphql.query<ResponseByNumberQuery, ResponseByNumberQueryVariables>(
    'responseByNumber',
    resolver
  )

/**
 * @param resolver a function that accepts a captured request and may return a mocked response.
 * @see https://mswjs.io/docs/basics/response-resolver
 * @example
 * mockResponsesQuery((req, res, ctx) => {
 *   const { storeId, filter, page, sort } = req.variables;
 *   return res(
 *     ctx.data({ requisitions })
 *   )
 * })
 */
export const mockResponsesQuery = (resolver: ResponseResolver<GraphQLRequest<ResponsesQueryVariables>, GraphQLContext<ResponsesQuery>, any>) =>
  graphql.query<ResponsesQuery, ResponsesQueryVariables>(
    'responses',
    resolver
  )

/**
 * @param resolver a function that accepts a captured request and may return a mocked response.
 * @see https://mswjs.io/docs/basics/response-resolver
 * @example
 * mockUpdateResponseLineMutation((req, res, ctx) => {
 *   const { storeId, input } = req.variables;
 *   return res(
 *     ctx.data({ updateResponseRequisitionLine })
 *   )
 * })
 */
export const mockUpdateResponseLineMutation = (resolver: ResponseResolver<GraphQLRequest<UpdateResponseLineMutationVariables>, GraphQLContext<UpdateResponseLineMutation>, any>) =>
  graphql.mutation<UpdateResponseLineMutation, UpdateResponseLineMutationVariables>(
    'updateResponseLine',
    resolver
  )

/**
 * @param resolver a function that accepts a captured request and may return a mocked response.
 * @see https://mswjs.io/docs/basics/response-resolver
 * @example
 * mockCreateOutboundFromResponseMutation((req, res, ctx) => {
 *   const { responseId, storeId } = req.variables;
 *   return res(
 *     ctx.data({ createRequisitionShipment })
 *   )
 * })
 */
export const mockCreateOutboundFromResponseMutation = (resolver: ResponseResolver<GraphQLRequest<CreateOutboundFromResponseMutationVariables>, GraphQLContext<CreateOutboundFromResponseMutation>, any>) =>
  graphql.mutation<CreateOutboundFromResponseMutation, CreateOutboundFromResponseMutationVariables>(
    'createOutboundFromResponse',
    resolver
  )
