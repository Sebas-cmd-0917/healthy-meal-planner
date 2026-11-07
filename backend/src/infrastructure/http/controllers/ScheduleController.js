export class ScheduleController {
  constructor({ listSchedule, createBlocks, updateBlock, deleteBlock }) {
    this.listSchedule = listSchedule;
    this.createBlocks = createBlocks;
    this.updateBlock = updateBlock;
    this.deleteBlock = deleteBlock;
  }

  // GET /api/schedule?from=2026-11-09&to=2026-11-15
  list = async (req, res) => {
    const blocks = await this.listSchedule.execute({ from: req.query.from, to: req.query.to });
    res.json({ data: blocks });
  };

  // POST /api/schedule  — un bloque, una lista, o { blocks: [...] }
  create = async (req, res) => {
    const body = req.body ?? {};
    const input = Array.isArray(body) ? body : Array.isArray(body.blocks) ? body.blocks : body;
    const blocks = await this.createBlocks.execute(input);
    res.status(201).json({ data: blocks });
  };

  // PATCH /api/schedule/:id
  update = async (req, res) => {
    const block = await this.updateBlock.execute(req.params.id, req.body ?? {});
    res.json({ data: block });
  };

  // DELETE /api/schedule/:id
  remove = async (req, res) => {
    await this.deleteBlock.execute(req.params.id);
    res.status(204).end();
  };
}
