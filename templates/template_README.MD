# Templates
These templates are intended to save you time when creating new component classes (copy and paste).  They 
follow some recommended patterns, and which one you choose depends on your use case.

1. **TemplateSimple** overrides manifold-dx's ContainerComponent's "render" function, so this component is 
   doing its own rendering.  Devs often prefer this, and is a good choice when the rendering is simple.
2. **TemplateRenderProps** has a manifold-dx RenderPropsContainer class that delegates to a FunctionComponent
   for rendering.  Render props are common in React, and are good when you need rendering to 
   be flexible across different usages.
3. **TemplateContainer** Is an older pattern ("Presentation and Container Components"), but may still be 
   useful when you want to separate a complex rendering from a container that houses a lot of logic (delegates
   to a FunctionComponent). 
   
Note that although #2 and #3 delegate to FunctionComponents, you can delegate to regular class components.   
