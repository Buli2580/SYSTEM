import {useSystem} from '../state/SystemProvider';
import type {WorldTrackingState} from '../world/tracking';
import {selectHomeReadModel,selectQuestReadModel,selectCharacterReadModel,selectWorldReadModel,
  selectSocialReadModel,type CloudAuthObservation,type QuestReadOptions,type CharacterReadExtras} from './visualReadModels';

/** Optional UI entry point. Uses the one existing provider and performs no IO. */
export function useVisualReadModels(options: {
  tracking?: WorldTrackingState|null;auth?: CloudAuthObservation;
  quests?: QuestReadOptions;character?: CharacterReadExtras;
}={}) {
  const source=useSystem();
  return {
    home:selectHomeReadModel(source),quest:selectQuestReadModel(source,options.quests),
    character:selectCharacterReadModel(source,options.character),
    world:selectWorldReadModel(source,options.tracking),
    social:selectSocialReadModel(source,options.auth),
  };
}
