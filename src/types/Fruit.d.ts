import { Model } from 'mongoose';
import { IFruit } from './Fruit';

declare global {
  var FruitModel: Model<IFruit>;
} 