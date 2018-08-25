// @flow
import { kebabCase, isDate, isUndefined } from 'lodash';

import { thingsUrlRequest } from './url-request';
import type { ID } from './url-request';

const convertAttributes = (attributes) =>
  Object.assign(
    ...Object.entries(attributes).map(
      ([key, value]) =>
        !isUndefined(value) && {
          [kebabCase(key)]: isDate(value) ? value.toISOString().split('.')[0] + 'Z' : value,
        }
    )
  );

type CommonAttributes = {
  title?: string,
  notes?: string, // text for the notes field. Maximum length: 10,000 characters.
  when?: Date | 'anytime' | 'someday', // Date adds a reminder for that time
  deadline?: Date,
  completed?: boolean,
  canceled?: boolean, // takes priority over completed.
  creationDate?: Date, // ignored if the date is in the future.
  completionDate?: Date, // ignored if the project is not completed or canceled, or if the date is in the future.
  tags?: string[], // strings corresponding to the titles of tags, ignored if tag doesn't exist yet
};

export type TodoAttributes = {
  ...CommonAttributes,
  heading?: string, // title of a heading within a project to add to, ignored if listId not specified, or heading doesn't exist yet
  listId?: ID, // The ID of a project or area to add to
  checklist?: {
    title?: string,
    completed?: boolean,
    canceled?: boolean,
  }[], // (maximum of 100).
};

export type ProjectAttributes = {
  ...CommonAttributes,
  area?: string, // The title of an area to add to, ignored if area doesn't exist yet
  headings?: string[], // names of the headings to create in the project
};

const makeTodoOp = (props: TodoAttributes, operation: 'create' | 'update' = 'create') => {
  const { checklist, ...other } = props;
  const attributes = convertAttributes(other);
  if (checklist) {
    attributes['checklist-items'] = checklist.map((item) => ({
      type: 'checklist-item',
      attributes: item,
    }));
  }
  return { operation, type: 'to-do', attributes };
};

export const createTodo = async (props: TodoAttributes): Promise<ID> => {
  const op = makeTodoOp(props);
  try {
    const res = await thingsUrlRequest([op]);
    return res[0];
  } catch (e) {
    console.log('things url op failed', JSON.stringify(op, null, 2));
    throw e;
  }
};

export const createTodos = async (props: TodoAttributes[]): Promise<ID[]> => {
  const ops = props.map((prop) => makeTodoOp(prop));
  try {
    const res = await thingsUrlRequest(ops);
    return res;
  } catch (e) {
    console.log('things url op failed', JSON.stringify(ops, null, 2));
    throw e;
  }
};

export const updateTodo = async (id: ID, props: TodoAttributes): Promise<ID> => {
  const op = makeTodoOp(props, 'update');
  const res = await thingsUrlRequest([{ ...op, id }]);
  return res[0];
};

const makeProjectOp = (props: TodoAttributes, operation: 'create' | 'update' = 'create') => {
  const { headings, ...other } = props;
  const attributes = convertAttributes(other);
  if (headings) {
    attributes.items = headings.map((heading) => ({
      type: 'heading',
      attributes: { title: heading },
    }));
  }
  return { operation, type: 'project', attributes };
};

export const createProject = async (props: ProjectAttributes): Promise<ID> => {
  const op = makeProjectOp(props);
  const res = await thingsUrlRequest([op]);
  return res[0];
};

export const updateProject = async (id: ID, props: ProjectAttributes): Promise<ID> => {
  const op = makeProjectOp(props, 'update');
  const res = await thingsUrlRequest([{ ...op, id }]);
  return res[0];
};
