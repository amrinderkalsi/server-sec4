import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { readFile } from 'node:fs/promises';
import { GraphQLScalarType } from 'graphql';
import { connectToDb, getDb } from './db.js';

const app = express();
let db;

app.use(express.json());

// db.issues.remove({})

// const issues = [
//     {
//       id: 1, 
//       status: 'Open', 
//       owner: 'Ravan',
//       created: new Date('2016-08-15'), 
//       effort: 5, 
//       completionDate: undefined,
//       title: 'Error in console when clicking Add',
//     },
//     {
//       id: 2, 
//       status: 'Assigned', 
//       owner: 'Eddie',
//       created: new Date('2016-08-16'), 
//       effort: 14, 
//       completionDate: new Date('2016-08-30'),
//       title: 'Missing bottom border on panel',
//     },
//   ];

// db.issues.insertMany(issues)

app.get('/api/issues', (req, res) => {
  issueList()
    .then(issues => {
      const metadata = {"totalCount" : issues.length};
      res.json({
          "metaData": metadata, "records": issues
      });
    })
})

app.post('/api/issues', (req, res) => {
    console.log(req.body);
    const newIssue = req.body;
    newIssue.id = issues.length + 1;
    newIssue.status = 'New';
    newIssue.created = new Date();
    issues.push(newIssue);
    console.log('res.json', newIssue)
    res.json(newIssue);
})

const graphQlDateType = new GraphQLScalarType({
  name: 'GraphQLDateType',
  description: 'A date type for GraphQl',
  serialize(value) {
    return value.toISOString();
  },
  parseValue(value) {
    const newDate = new Date(value);
    return isNaN(newDate) ? undefined : newDate
  }
});


const typeDefs = await readFile('./schema.graphql', 'utf8')

const issueList = async () => {
  const issues = await db.collection('issues').find().toArray();
  return issues;
}

const resolvers = {
  Query: {
    name: () => 'Erick',
    issueList: issueList
  },
  GraphQLDateType: graphQlDateType,
  Mutation: {
    sendName: (_root, {name}) => {
      return name+`!`;
    },
    issueAdd: (_root, {issue}) => {
      issue.id = issues.length + 1;
      issue.status = 'New';
      issue.created = new Date();
      issues.push(issue);
      return issue;
    }
  }
};

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers
});

await apolloServer.start();

app.use('/graphql', expressMiddleware(apolloServer));

connectToDb((url, err) => {
  if (!err) {
    app.listen(5002, () => {
        console.log('Server started on port 5002');
        console.log('GraphQl server started on http://localhost:5002/graphql');
        console.log('MongoDb started at url', url);
    });
    db = getDb();
  }
});

