import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled'
import { buildSubgraphSchema } from '@apollo/subgraph'
import {
  handlers,
  startServerAndCreateLambdaHandler,
} from '@as-integrations/aws-lambda'

import { connection } from '../memoryDB/connection'

import typeDefs from '../typeDefs'
import resolvers from './resolvers'

const { NODE_ENV = 'local' } = process.env

const schema = buildSubgraphSchema({ typeDefs, resolvers })

const requestHandler = handlers.createAPIGatewayProxyEventRequestHandler()

const apolloServer = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginInlineTraceDisabled()],
  includeStacktraceInErrorResponses: true,
  status400ForVariableCoercionErrors: true,
  introspection: true,
})

const buildContext = startServerAndCreateLambdaHandler(
  apolloServer,
  requestHandler,
  {
    context: async ({ event, context }) => {
      context.callbackWaitsForEmptyEventLoop = false
      console.log(`Connected in ${NODE_ENV} environment`)
      await connection()
      return {
        headers: event.headers,
        functionName: context.functionName,
        event,
        context,
      }
    },
  }
)

export default buildContext
