import express from 'express';
import bodyParser from 'body-parser';
import {
  graphqlExpress,
  graphiqlExpress
} from 'apollo-server-express';
import {
  makeExecutableSchema
} from 'graphql-tools';
import {
  express as voyagerMiddleware
} from 'graphql-voyager/middleware';
import {
  find,
  filter
} from 'lodash';


const typeDefs = `
 

 type Concept {
 	  id: Int!
    conceptLabel : [String]
    isCharacteristic : Boolean
    name : String!
    description : String!
    isComparableTo : [Concept]
    isQualificationOf : [Concept]
 }
 
 type UnitType {
 	  id: Int!
    name : String!
    description : String!
    references : [UnitType]
    isBasedOn : [Concept]!
 }

 
 type Variable {
 	  id: Int!
    name : String!
    description : String!
    isComparableTo : [Variable]
    unitTypeId : UnitType!
    measures : Concept!
    representedVariable : [RepresentedVariable]
 }

 # A Represented Variable is variable 
 # that has an associated definition of the value
 type RepresentedVariable  {
 	  id: Int!
    shortName : String
    isTypicallySensitive : Boolean!
    name : String!
    description : String!
    variable : Variable!
  #  isMeasuredBy : ValueDomain!
} 
 

# A question within an instrument
type Question {
    id: Int!
    # The name of the question
    name : String!
    # The description for the question 
    questionPurpose : String
    # The display text for the question
    questionText : String
    # A reference to an associated question
    references : [Question]
    # The Represented Variable or Variable and associated Value details
    representedVariable : RepresentedVariable!
}


# A collection of Questions for a specific Unit Type
type QuestionBlock {
    id: Int!
    # The name of the question block
    name : String!
    # The description for the question block 
    description : String!
    # A list of questions within the block 
    questions : [Question]
} 



  # the schema allows the following queries:
  type Query {
    # List all Question Blocks
    allQuestionBlocks : [QuestionBlock],
    # List all Questions
    allQuestions : [Question],
    # List all Represented Variables
    allRepresentedVariables : [RepresentedVariable],
    # List all Variables
    allVariables : [Variable],
    # List all Unit Types
    allUnitTypes: [UnitType],
    # List all Cooncepts
    allConcepts: [Concept],
    
    # Get a specific Question Block based on the ID
    QuestionBlock(id: Int!): QuestionBlock,

    # Get a specific Question based on the ID
    Question(id: Int!): Question,

    # Get a specific Represented Variable based on the ID
    RepresentedVariable(id: Int!): RepresentedVariable,

    # Get a specific Variable based on the ID
    Variable(id: Int!): Variable,

    # Get a specific Unit Type based on the ID
    UnitType(id: Int!): UnitType,

    # Get a specific Concept based on the ID
    Concept(id: Int!): Concept
    
  }

`;



const resolvers = {
  Query: {
    allQuestionBlocks: () => QUESTION_BLOCKS,
    allQuestions: () => QUESTIONS,
    allRepresentedVariables: () => REPRESENTED_VARIABLES,
    allVariables: () => VARIABLES,
    allUnitTypes: () => UNIT_TYPES,
    allConcepts: () => CONCEPTS,

    QuestionBlock: (_, {
      id
    }) => find(QUESTION_BLOCKS, {
      id: id
    }),
    Question: (_, {
      id
    }) => find(QUESTIONS, {
      id: id
    }),
    RepresentedVariable: (_, {
      id
    }) => find(REPRESENTED_VARIABLES, {
      id: id
    }),
    Variable: (_, {
      id
    }) => find(VARIABLES, {
      id: id
    }),
    UnitType: (_, {
      id
    }) => find(UNIT_TYPES, {
      id: id
    }),
    Concept: (_, {
      id
    }) => find(CONCEPTS, {
      id: id
    }),

  },
  RepresentedVariable: {
    variable: (representedVariable) => find(VARIABLES, {
      id: representedVariable.takesMeaningFrom
    }),
  },
  Variable: {
    representedVariable: (variable) => filter(REPRESENTED_VARIABLES, {
      id: variable
    }),
  },

  QuestionBlock: {
    questions: (root) => root.questions.map(quest => {
      return QUESTIONS.filter(
        singleQ => singleQ.id === quest
      )[0];
    }),
  },

  Question: {
    representedVariable: (question) => find(REPRESENTED_VARIABLES, {
      id: question.representedVariableId
    }),
  }
};


const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const GRAPHQL_PORT = 3000;

const app = express();

app.use('/graphql', bodyParser.json(), graphqlExpress({
  schema
}));
app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql'
}));
app.use('/voyager', voyagerMiddleware({
  endpointUrl: '/graphql'
}));


app.listen(GRAPHQL_PORT, () =>
  console.log(
    `GraphiQL is now running on http://localhost:${GRAPHQL_PORT}/graphiql`
  )
);



const CONCEPTS = [{
    id: 0,
    name: 'CONCEPT',
    description: 'CONCEPT TBD'
  },
  {
    id: 1,
    name: 'Person',
    description: 'A person is defined as a human being.'
  },
  {
    id: 2,
    name: 'Household',
    description: 'A group of persons who share the same living accommodation, who pool some, or all, of their income and wealth and who consume certain types of goods and services collectively, mainly housing and food.'
  }
];

const UNIT_TYPES = [{
    id: 0,
    name: 'UNIT TYPE',
    description: 'UNIT TYPE TBD',
    isBasedOn: 0
  },
  {
    id: 1,
    name: 'Person',
    description: 'A person is defined as a human being.',
    isBasedOn: 1
  },
  {
    id: 2,
    name: 'Household',
    description: 'A group of persons who share the same living accommodation, who pool some, or all, of their income and wealth and who consume certain types of goods and services collectively, mainly housing and food.',
    isBasedOn: 2
  },
  {
    id: 3,
    name: 'Business',
    description: 'An entity engaging in productive activity and/or other forms of economic activity in the economy. Such entities accumulate assets on their own account and/or hold assets on behalf of others, and may incur liabilities.',
    isBasedOn: 3
  },
  {
    id: 4,
    name: 'Social Episode',
    description: 'The Social episode unit type is used when the data is about a characteristic or grouping of social units, rather than a social unit type (i.e.: a person, income unit, family, or household).',
    isBasedOn: 3
  }
];


const VARIABLES = [{
    id: 0,
    name: 'VARIABLE',
    description: 'VARIABLE TBD',
    unitTypeId: 0,
    measures: 0
  },
  {
    id: 1,
    name: 'Victimisation of Person',
    description: 'Whether a person has had physical force or violence used against them',
    unitTypeId: 1,
    measures: 0
  }
];


const REPRESENTED_VARIABLES = [{
    id: 0,
    name: 'REPRESENTED VARIABLES',
    description: 'REPRESENTED VARIABLES TBD',
    takesMeaningFrom: 0
  },
  {
    id: 1,
    name: 'Person experienced physical force or violence',
    description: 'Whether a person has had physical force or violence used against them',
    takesMeaningFrom: 1
  },
  {
    id: 2,
    name: 'Person experienced physical force or violence',
    description: 'How many times an event occurred',
    takesMeaningFrom: 1
  },
  {
    id: 3,
    name: 'Person threatened with physical harm',
    description: 'Person threatened with physical harm',
    takesMeaningFrom: 1
  },
  {
    id: 4,
    name: 'Person threatened with physical harm',
    description: 'How many times an event occurred',
    takesMeaningFrom: 1
  },
  {
    id: 5,
    name: 'Person\'s home shed or garage broken into',
    description: 'Persons home shed or garage broken into',
    takesMeaningFrom: 1
  },
  {
    id: 6,
    name: 'Person\'s home shed or garage broken into',
    description: 'How many times an event occurred',
    takesMeaningFrom: 1
  },
  {
    id: 7,
    name: 'Signs of attempted break-in to household',
    description: 'Whether a person has noticed any signs of an attempted break-in to their household',
    takesMeaningFrom: 1
  },
  {
    id: 8,
    name: 'Signs of attempted break-in to household',
    description: 'How many times an event occurred',
    takesMeaningFrom: '1'
  },
  {
    id: 9,
    name: 'RV Sexual assault ',
    description: 'Whether a person has been a victim of sexual assault or attempted sexual assault',
    takesMeaningFrom: 1
  }
];


const QUESTIONS = [{
    id: 0,
    name: 'QUESTION',
    description: 'QUESTIONS TBD',
    representedVariableId: 0
  },
  {
    id: 1,
    name: 'Person experienced physical force or violence',
    description: 'This question collects whether a person has had physical force or violence used against them. This is a single-response question asked with a pick list.',
    representedVariableId: 1
  },
  {
    id: 2,
    name: 'Person experienced physical force or violence',
    description: 'This question collects how many times a person has had physical force or violence used against them. This question is asked with a numeric entry field.',
    representedVariableId: 2
  },
  {
    id: 3,
    name: 'Person threatened with physical harm',
    description: 'This question collects whether a person  was threatened with physical harm, excluding any cases recorded in the previous question. This is a single-response question asked with a pick list',
    representedVariableId: 3
  },
  {
    id: 4,
    name: 'Person threatened with physical harm',
    description: 'This question collects how many times a person was threatened with physical harm face-to-face, excluding any cases recorded in the previous question. This question is asked with a numeric entry field',
    representedVariableId: 4
  },
  {
    id: 5,
    name: 'Person\'s home shed or garage broken into',
    description: 'This question collects whether a person\'s home, shed or garage was broken into in the last 12 months. This is a single-response question asked with a pick list',
    representedVariableId: 5
  },
  {
    id: 6,
    name: 'Person\'s home shed or garage broken into',
    description: 'This question collects how many times a person\'s home, shed or garage was broken into in the last 12 months. This question is asked with a numeric entry field',
    representedVariableId: 6
  },
  {
    id: 7,
    name: 'Signs of attempted break-in to household',
    description: 'This question collects whether a person has noticed any signs of an attempted beak-in to their home, shed or garage in the last 12 months. This is a single-response question asked with a pick list.',
    representedVariableId: 7
  },
  {
    id: 8,
    name: 'Signs of attempted break-in to household',
    description: 'This question collects how many attempted break-ins a person has noted on their home, shed or garage in the last 12 months. This question is asked with a numeric entry field.',
    representedVariableId: 8
  },
  {
    id: 9,
    name: 'Sexual assault',
    description: 'This question collects whether a person has been a victim of sexual assault or attempted sexual assault in the last 12 months. This is a single-response question asked with a pick list.',
    representedVariableId: 9
  }
];

const QUESTION_BLOCKS = [{
    id: 0,
    name: 'QUESTION_BLOCKS',
    description: 'QUESTION_BLOCKS TBD',
    questions: [0]
  },
  {
    id: 1,
    name: 'Victimisation',
    description: 'Victimisation question module',
    questions: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  }
];