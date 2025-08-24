# NO1Creative Scene Editor - Product Brief

## What
A browser-based 3D scene editor designed specifically for composing YouTube thumbnail shots using poseable avatar proxies. The tool allows users to quickly arrange 3D characters, adjust lighting, camera angles, and backgrounds to create reference compositions that artists can use as blueprints for final thumbnail artwork.

## Who
**Primary Users:**
- NO1Creative internal team members
- NO1Creative agency clients (YouTubers and content creators)
- Thumbnail artists working with the agency

**User Workflow:**
1. **Clients**: Upload photos → generate 3D avatars → compose scenes
2. **Internal Team**: Provide direction and feedback on compositions
3. **Artists**: Use exported snapshots as reference for final thumbnail creation

## Why
**Current Problem:**
- Time-consuming back-and-forth between clients, agency, and artists
- Difficulty communicating pose and composition ideas
- Multiple revision cycles for thumbnail concepts

**Solution Benefits:**
- **Speed**: Rapid pose and composition iteration
- **Clarity**: Visual references eliminate miscommunication
- **Efficiency**: Fewer revision cycles needed
- **Cost**: Faster turnaround reduces production costs

## Core Features (MVP)
1. **Avatar Management**: Upload and load .glb/.gltf rigged characters
2. **Pose Control**: IK-based posing system for natural character positioning
3. **Scene Composition**: Camera controls, lighting adjustment, background options
4. **Expression Control**: Morph target sliders for facial expressions
5. **Export System**: High-quality PNG snapshots + scene JSON for reproducibility

## Out of Scope (MVP)
- 4D Gaussian Splatting / NeRF rendering
- AI-powered image generation or enhancement
- Real-time collaboration features
- User accounts, billing, or analytics
- Mobile/tablet optimization
- Advanced physics or animation systems

## Success Metrics
- **Speed**: Scene composition in under 10 minutes
- **Quality**: Exported images suitable for artist reference
- **Adoption**: Used for 80%+ of agency thumbnail projects
- **Efficiency**: 50% reduction in revision cycles

## Future Phases (Post-MVP)
1. **AI Integration**: Photo-to-3D avatar generation
2. **Asset Library**: Pre-made poses, expressions, and environments
3. **Collaboration**: Multi-user editing and commenting
4. **Mobile Support**: Tablet-optimized interface
5. **Analytics**: Usage tracking and performance metrics
6. **Client Portal**: Branded experience for agency clients

## Technical Constraints
- **Performance**: 60fps on mid-range hardware
- **Browser Support**: Modern Chrome, Firefox, Safari, Edge
- **File Size**: Avatar files under 50MB each
- **Export Quality**: Minimum 1920×1080 resolution
- **Load Time**: Scene ready in under 30 seconds

## Business Impact
- **Revenue**: Faster delivery enables higher client volume
- **Quality**: Consistent reference materials improve final output
- **Scalability**: Self-service tools reduce manual coordination
- **Differentiation**: Unique workflow competitive advantage
