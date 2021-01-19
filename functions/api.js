require('dotenv').config();

const express = require('express');
const bodyParser = require("body-parser");
const graphqlHTTP = require('express-graphql');
const graphql = require('graphql');
const joinMonster = require('join-monster');
const serverless = require("serverless-http");

// Connect to database
const { Client } = require('pg');
const client = new Client({
	host: 'ec2-52-2-82-109.compute-1.amazonaws.com',
	user: 'cnbqzzcigksegd',
	password: process.env.DB_PASSWORD,
	database: 'de53humkobaq73',
	ssl: {
		rejectUnauthorized: false,
	},
});
client.connect();

// Define the schema
const Artist = new graphql.GraphQLObjectType({
	name: 'Artist',
	fields: () => ({
		id: { type: graphql.GraphQLInt },
		name: { type: graphql.GraphQLString },
	}),
});

Artist._typeConfig = {
	sqlTable: 'artists',
	uniqueKey: 'id',
};

// Define the schema
const Album = new graphql.GraphQLObjectType({
	name: 'Album',
	fields: () => ({
		id: { type: graphql.GraphQLInt },
		artist: { type: graphql.GraphQLString },
		title: { type: graphql.GraphQLString },
		rank: { type: graphql.GraphQLString },
		image: { type: graphql.GraphQLString },
		blurhash: { type: graphql.GraphQLString },
		artists: { type: graphql.GraphQLList(graphql.GraphQLInt) },
	}),
});

Album._typeConfig = {
	sqlTable: 'albums',
	uniqueKey: 'id',
};

const QueryRoot = new graphql.GraphQLObjectType({
	name: 'Query',
	fields: () => ({
		artists: {
			type: new graphql.GraphQLList(Artist),
			resolve: (parent, args, context, resolveInfo) => {
				return joinMonster.default(resolveInfo, {}, (sql) => {
					return client.query(sql);
				});
			},
		},
		albums: {
			type: new graphql.GraphQLList(Album),
			resolve: (parent, args, context, resolveInfo) => {
				return joinMonster.default(resolveInfo, {}, (sql) => {
					return client.query(sql);
				});
			},
		},
	}),
});

const schema = new graphql.GraphQLSchema({
	query: QueryRoot,
});

// Create the Express app
const app = express();

app.use(bodyParser.json());
app.use(
	'/',
	graphqlHTTP({
		schema: schema,
		graphiql: true,
	})
);

module.exports.handler = serverless(app);
