import FileSignature from '../models/File_signature';

class FileSController {
  // método para cadastrar assinatura / method to register subscription
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;

    const file = await FileSignature.create({
      name,
      path,
    });
    return res.json(file);
  }
}

export default new FileSController();
