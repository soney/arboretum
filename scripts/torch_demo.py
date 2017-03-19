import torch
from torch.autograd import Variable

x = Variable(torch.ones(2, 2), requires_grad = True)

y = 2*x + 4

print(y.grad)
