import Knex from 'knex'

const url = `${process.env.POSTGRES_URL}?sslmode=require`

const knex = Knex({
	client: 'pg',
	connection: url
})

export default knex
