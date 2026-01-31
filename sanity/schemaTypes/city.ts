import { defineField, defineType } from "sanity";

export const city = defineType({
  name: 'city',
  title: 'City',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'reference',
      to: [{ type: 'country' }],
      description: 'Country this city belongs to',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cityCode',
      title: 'City code',
      type: 'string',
      description: 'Unique identifier from Bokun (e.g. Biarritz). Used for document ID. No spaces.',
      validation: (rule) =>
        rule
          .required()
          .regex(/^\S+$/, 'City code must not contain spaces'),
    }),
    defineField({
      name: 'countryCode',
      title: 'Country code',
      type: 'string',
      description: 'ISO2 country code mirrored from Bokun (e.g. FR, ES)',
      validation: (rule) =>
        rule
          .required()
          .length(2)
          .regex(/^[A-Z]{2}$/, 'Must be 2 uppercase letters (ISO2)'),
    }),
  ],
})