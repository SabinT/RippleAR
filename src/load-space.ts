import * as ecs from '@8thwall/ecs'

// todo: update check UI
ecs.registerComponent({
  name: 'load-space',
  schema: {
    button1: ecs.eid,
    button2: ecs.eid,
    button3: ecs.eid,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    const {button1, button2, button3} = schemaAttribute.get(eid)

    ecs.defineState('space1')
      .initial()
      .onEnter(() => {
        console.log('space1')
        world.spaces.loadSpace('Default')
      })
      .onEvent(ecs.input.UI_CLICK, 'space2', {target: button2})
      .onEvent(ecs.input.UI_CLICK, 'space3', {target: button3})

    ecs.defineState('space2')
      .onEnter(() => {
        console.log('space2')
        world.spaces.loadSpace('BMO Bites')
      })
      .onEvent(ecs.input.UI_CLICK, 'space1', {target: button1})
      .onEvent(ecs.input.UI_CLICK, 'space3', {target: button3})

    ecs.defineState('space3')
      .onEnter(() => {
        console.log('space3')
        world.spaces.loadSpace('Video')
      })
      .onEvent(ecs.input.UI_CLICK, 'space1', {target: button1})
      .onEvent(ecs.input.UI_CLICK, 'space2', {target: button2})
  },
})
