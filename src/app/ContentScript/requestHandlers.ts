import { pingFactory } from '../../requests/contentscript/ping';
import { translateSelectedTextFactory } from '../../requests/contentscript/translateSelectedText';

export const requestHandlers = [pingFactory, translateSelectedTextFactory];
