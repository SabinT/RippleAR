import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'HideOnClickOrTouch',
  schema: {
    // the entity you want to hide
    targetEntity: ecs.eid,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('default')
      .initial()
      .listen(eid, ecs.input.UI_CLICK, (e) => {
        ecs.Disabled.set(world, eid, {})
      })
  },
})
